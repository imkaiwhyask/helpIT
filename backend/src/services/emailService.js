"use strict";

const nodemailer = require("nodemailer");

// Lazy-initialized once at first send attempt
let _transporter = null;

function _getTransporter() {
  if (_transporter) return _transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) return null;
  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: false, // STARTTLS on 587, not implicit TLS
    requireTLS: true,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  return _transporter;
}

// In-memory queue drains at 1 email/2 s (≤ 30/min, matching M365 mailbox limit)
const _queue = [];
let _drainTimer = null;

function _startDrain() {
  if (_drainTimer) return;
  _drainTimer = setInterval(async () => {
    if (!_queue.length) return;
    const fn = _queue.shift();
    try {
      await fn();
    } catch (err) {
      console.error("[email] send error:", err.message);
    }
  }, 2000);
  _drainTimer.unref(); // don't keep the process alive during clean shutdown
}

function _enqueue(fn) {
  _queue.push(fn);
  _startDrain();
}

// ── helpers ──────────────────────────────────────────────────────────────────

function _baseUrl() {
  return (process.env.CORS_ORIGIN || "").replace(/\/$/, "");
}

function _ticketUrl(id) {
  return `${_baseUrl()}/tickets/${id}`;
}

function _subject(ticketId, text) {
  return `[helpIT #${ticketId}] ${text}`;
}

function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const _PRIORITY_COLORS = {
  critical: "#dc2626",
  high: "#FD6300",
  medium: "#d97706",
  low: "#16a34a",
};

function _priorityBadge(priority) {
  const p = (priority || "").toLowerCase();
  const color = _PRIORITY_COLORS[p] || "#6b7280";
  return `<span style="display:inline-block;padding:2px 10px;border-radius:20px;background:${color};color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">${_esc(priority)}</span>`;
}

function _infoTable(ticket, extraRow) {
  const rows = [
    ["Ticket", `<strong style="color:#002D72">#${ticket.id}</strong>`],
    ["Title", _esc(ticket.title)],
    ["Category", _esc(ticket.category || "—")],
    ["Priority", _priorityBadge(ticket.priority)],
  ];
  const rowsHtml = rows
    .map(
      ([label, value], i) => `
    <tr style="background:${i % 2 === 0 ? "#f8f9fb" : "#fff"}">
      <td style="padding:9px 14px;color:#6b7280;font-size:13px;width:110px;border-bottom:1px solid #edf0f2">${label}</td>
      <td style="padding:9px 14px;font-size:14px;border-bottom:1px solid #edf0f2">${value}</td>
    </tr>`,
    )
    .join("");
  const extra = extraRow
    ? `<tr style="background:${rows.length % 2 === 0 ? "#f8f9fb" : "#fff"}">${extraRow}</tr>`
    : "";
  return `
    <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #edf0f2;border-radius:6px;overflow:hidden">
      ${rowsHtml}${extra}
    </table>`;
}

function _htmlWrap(headline, bodyHtml, ticketId) {
  const url = _ticketUrl(ticketId);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef0f3;font-family:Arial,sans-serif;color:#1a1a2e">
<div style="max-width:600px;margin:32px auto">
  <div style="height:4px;background:#FD6300;border-radius:6px 6px 0 0"></div>
  <div style="background:#fff;border-radius:0 0 8px 8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#002D72;padding:20px 28px">
      <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-.2px">helpIT</span><span style="color:#FD6300;font-size:20px;font-weight:700"> &middot;</span><span style="color:rgba(255,255,255,.55);font-size:13px;margin-left:7px">Service desk. Simplified.</span>
    </div>
    <div style="padding:28px 28px 24px">
      <h2 style="margin:0 0 4px;font-size:17px;font-weight:700;color:#002D72">${_esc(headline)}</h2>
      <div style="height:2px;width:36px;background:#FD6300;margin-bottom:20px;border-radius:2px"></div>
      ${bodyHtml}
      <div style="margin-top:28px">
        <a href="${url}" style="display:inline-block;background:#002D72;color:#fff;padding:11px 24px;text-decoration:none;border-radius:5px;font-size:14px;font-weight:600">View Ticket &rarr;</a>
      </div>
    </div>
    <div style="padding:13px 28px;background:#f8f9fb;border-top:1px solid #edf0f2;font-size:12px;color:#9ca3af">
      helpIT &nbsp;&bull;&nbsp; Automated notification &mdash; do not reply to this email.
    </div>
  </div>
</div>
</body>
</html>`;
}

async function _send(to, subject, html, text) {
  const t = _getTransporter();
  if (!t) return; // SMTP not configured — silently skip
  const from = `"${process.env.SMTP_FROM_NAME || "helpIT Notifications"}" <${process.env.SMTP_FROM_ADDRESS || process.env.SMTP_USER}>`;
  await t.sendMail({ from, to, subject, html, text });
}

function _enqueueEach(addresses, subject, html, text) {
  for (const to of addresses) {
    _enqueue(() => _send(to, subject, html, text));
  }
}

// ── notification functions ────────────────────────────────────────────────────

// Ticket created and auto-assigned → notify assigned tech
function notifyAssigned(ticket, assignee, requesterName) {
  if (!assignee?.email) return;
  const subject = _subject(
    ticket.id,
    `New ticket assigned to you: ${ticket.title}`,
  );
  const extraRow = `<td style="padding:9px 14px;color:#6b7280;font-size:13px;border-bottom:1px solid #edf0f2">Requester</td><td style="padding:9px 14px;font-size:14px;border-bottom:1px solid #edf0f2">${_esc(requesterName)}</td>`;
  const html = _htmlWrap(
    "A new ticket has been assigned to you",
    _infoTable(ticket, extraRow),
    ticket.id,
  );
  const text = [
    "A new ticket has been assigned to you.",
    `Ticket #${ticket.id}: ${ticket.title}`,
    `Priority: ${ticket.priority} | Category: ${ticket.category || ""}`,
    `Requester: ${requesterName}`,
    `View: ${_ticketUrl(ticket.id)}`,
  ].join("\n\n");
  _enqueueEach([assignee.email], subject, html, text);
}

// Ticket reassigned to a different person → notify new assignee only
function notifyReassigned(ticket, newAssignee) {
  if (!newAssignee?.email) return;
  const subject = _subject(
    ticket.id,
    `Ticket reassigned to you: ${ticket.title}`,
  );
  const html = _htmlWrap(
    "A ticket has been reassigned to you",
    _infoTable(ticket),
    ticket.id,
  );
  const text = [
    "A ticket has been reassigned to you.",
    `Ticket #${ticket.id}: ${ticket.title}`,
    `Priority: ${ticket.priority} | Category: ${ticket.category || ""}`,
    `View: ${_ticketUrl(ticket.id)}`,
  ].join("\n\n");
  _enqueueEach([newAssignee.email], subject, html, text);
}

// Public comment added → notify requester + assigned tech, excluding the comment author
function notifyComment(ticket, commentContent, authorUserId) {
  const recipients = [];

  if (ticket.created_by !== authorUserId && ticket.creator?.email) {
    recipients.push({ id: ticket.created_by, email: ticket.creator.email });
  }
  if (
    ticket.assigned_to &&
    ticket.assigned_to !== authorUserId &&
    ticket.assigned_user?.email &&
    !recipients.some((r) => r.id === ticket.assigned_to)
  ) {
    recipients.push({
      id: ticket.assigned_to,
      email: ticket.assigned_user.email,
    });
  }
  if (!recipients.length) return;

  const subject = _subject(ticket.id, `New reply: ${ticket.title}`);
  const commentBlock = `
    <p style="margin:16px 0 8px;font-size:14px;color:#374151">A new reply has been added:</p>
    <blockquote style="margin:0;padding:12px 16px;border-left:3px solid #FD6300;background:#fff8f3;border-radius:0 5px 5px 0;font-size:14px;color:#374151;line-height:1.5">${_esc(commentContent)}</blockquote>`;
  const html = _htmlWrap(
    "New reply on your ticket",
    _infoTable(ticket) + commentBlock,
    ticket.id,
  );
  const text = [
    `A new reply has been added to ticket #${ticket.id}: ${ticket.title}`,
    `Reply: ${commentContent}`,
    `View: ${_ticketUrl(ticket.id)}`,
  ].join("\n\n");
  _enqueueEach(
    recipients.map((r) => r.email),
    subject,
    html,
    text,
  );
}

// Ticket resolved or closed → notify requester only
function notifyResolved(ticket, requester) {
  if (!requester?.email) return;
  const label = ticket.status === "closed" ? "closed" : "resolved";
  const subject = _subject(
    ticket.id,
    `Your ticket has been ${label}: ${ticket.title}`,
  );
  const html = _htmlWrap(
    `Your ticket has been ${label}`,
    `<p style="margin:0 0 8px">Your support ticket has been marked as <strong>${label}</strong>.</p>` +
      _infoTable(ticket),
    ticket.id,
  );
  const text = [
    `Your ticket has been ${label}.`,
    `Ticket #${ticket.id}: ${ticket.title}`,
    `Priority: ${ticket.priority} | Category: ${ticket.category || ""}`,
    `View: ${_ticketUrl(ticket.id)}`,
  ].join("\n\n");
  _enqueueEach([requester.email], subject, html, text);
}

// Call once at startup — warns if SMTP is unconfigured but never throws
function checkConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn(
      "[email] SMTP credentials not configured — email notifications disabled",
    );
  }
}

module.exports = {
  notifyAssigned,
  notifyReassigned,
  notifyComment,
  notifyResolved,
  checkConfig,
};
