-- CreateIndex
CREATE INDEX "kb_articles_author_id_idx" ON "kb_articles"("author_id");

-- CreateIndex
CREATE INDEX "kb_articles_is_published_idx" ON "kb_articles"("is_published");

-- CreateIndex
CREATE INDEX "ticket_attachments_ticket_id_idx" ON "ticket_attachments"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_comments_ticket_id_idx" ON "ticket_comments"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_comments_user_id_idx" ON "ticket_comments"("user_id");

-- CreateIndex
CREATE INDEX "tickets_created_by_idx" ON "tickets"("created_by");

-- CreateIndex
CREATE INDEX "tickets_assigned_to_idx" ON "tickets"("assigned_to");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_created_at_idx" ON "tickets"("created_at");
