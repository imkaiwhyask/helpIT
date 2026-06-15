<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  elevation:   { type: Number,  default: 2 },
  interactive: { type: Boolean, default: false },
  tag:         { type: String,  default: 'div' },
})

const slots = useSlots()

// MDL defines exactly 7 shadow levels: 2 / 3 / 4 / 6 / 8 / 16 / 24 dp.
// 0 = flat (no shadow). Values outside this set fall back to z2.
const SHADOW_MAP = {
  0:  'none',
  2:  'var(--md1-shadow-z2)',
  3:  'var(--md1-shadow-z3)',
  4:  'var(--md1-shadow-z4)',
  6:  'var(--md1-shadow-z6)',
  8:  'var(--md1-shadow-z8)',
  16: 'var(--md1-shadow-z16)',
  24: 'var(--md1-shadow-z24)',
}

const shadow = computed(() => SHADOW_MAP[props.elevation] ?? SHADOW_MAP[2])
</script>

<template>
  <!--
    Md1Card — MDL card anatomy (mdl-card).
    Slots:  media (top image), title, subtitle, default (body text),
            actions (footer button row), menu (top-right corner — icon buttons, links)
    Props:  elevation (MDL dp level, default 2), interactive (hover lift + ripple), tag
  -->
  <component
    :is="tag"
    class="md1-card"
    :class="{ 'md1-card--interactive': interactive }"
    :style="{ boxShadow: shadow }"
    v-md1-ripple.dark="interactive"
  >
    <!-- mdl-card__media — top image/colour block -->
    <div v-if="slots.media" class="md1-card__media">
      <slot name="media" />
    </div>

    <!-- mdl-card__title — rendered only when title or subtitle slot is filled -->
    <div v-if="slots.title || slots.subtitle" class="md1-card__title">
      <h2 v-if="slots.title" class="md1-card__title-text">
        <slot name="title" />
      </h2>
      <p v-if="slots.subtitle" class="md1-card__subtitle-text">
        <slot name="subtitle" />
      </p>
    </div>

    <!-- mdl-card__supporting-text — main body / default slot -->
    <div v-if="slots.default" class="md1-card__body">
      <slot />
    </div>

    <!-- mdl-card__actions — footer button row -->
    <div v-if="slots.actions" class="md1-card__actions">
      <slot name="actions" />
    </div>

    <!-- mdl-card__menu — top-right corner, position: absolute; top/right: 16px
         Source: _card.scss .mdl-card__menu
         Accepts icon buttons, links, or el-dropdown triggers. -->
    <div v-if="slots.menu" class="md1-card__menu">
      <slot name="menu" />
    </div>
  </component>
</template>

<style scoped>
/* ── Root shell ──────────────────────────────────────────────────────────
   Source: _card.scss .mdl-card
   $card-z-index: 1, border-radius: 2px, overflow: hidden, flex column
   ──────────────────────────────────────────────────────────────────────── */
.md1-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--md1-surface);
  border-radius: var(--md1-radius-base);
  z-index: 1;
  box-sizing: border-box;
  /* hover-lift transition — fast-out-slow-in, MDL default duration */
  transition: box-shadow var(--md1-duration-standard) var(--md1-ease-standard);
}

.md1-card--interactive { cursor: pointer; }

/* 2dp → 8dp on hover — Material Design 1 spec interactive card elevation */
.md1-card--interactive:hover {
  box-shadow: var(--md1-shadow-z8) !important;
}

/* ── Media ───────────────────────────────────────────────────────────────
   Source: _card.scss .mdl-card__media
   Consumer sets height + background-image via inline style or child element.
   ──────────────────────────────────────────────────────────────────────── */
.md1-card__media {
  background-color: var(--md1-grey-300);
  background-repeat: no-repeat;
  background-position: 50% 50%;
  background-size: cover;
  box-sizing: border-box;
}

/* ── Title block ─────────────────────────────────────────────────────────
   Source: _card.scss .mdl-card__title
   padding: $card-vertical-padding $card-horizontal-padding = 16px 16px
   ──────────────────────────────────────────────────────────────────────── */
.md1-card__title {
  display: flex;
  flex-direction: column;
  padding: var(--md1-space-2) var(--md1-space-2);
  box-sizing: border-box;
}

/* $card-title-font-size: 24px, $card-title-text-font-weight: 300 */
.md1-card__title-text {
  font-size: var(--md1-type-headline-size);
  font-weight: var(--md1-card-title-weight) !important;
  line-height: var(--md1-type-headline-lh);
  color: var(--md1-text-primary);
  margin: 0;
}

/* $card-subtitle-font-size: 14px, $card-subtitle-color: rgba(0,0,0,0.54) */
.md1-card__subtitle-text {
  font-size: var(--md1-type-body1-size);
  font-weight: var(--md1-type-body1-weight);
  color: var(--md1-text-secondary);
  margin: 4px 0 0;
}

/* ── Supporting text / body ──────────────────────────────────────────────
   Source: _card.scss .mdl-card__supporting-text
   $card-supporting-text-font-size: 1rem (16px)
   $card-supporting-text-line-height: 18px
   $card-supporting-text-text-color: rgba(0,0,0,0.54)
   padding: $card-vertical-padding $card-horizontal-padding = 16px 16px
   ──────────────────────────────────────────────────────────────────────── */
.md1-card__body {
  padding: var(--md1-space-2) var(--md1-space-2);
  color: var(--md1-text-secondary);
  font-size: var(--md1-type-subhead-size);
  line-height: 18px;
  box-sizing: border-box;
}

/* ── Actions ─────────────────────────────────────────────────────────────
   Source: _card.scss .mdl-card__actions
   $card-actions-font-size: 16px, padding: 8px (exact MDL value)
   ──────────────────────────────────────────────────────────────────────── */
.md1-card__actions {
  display: flex;
  align-items: center;
  gap: var(--md1-space-1);
  padding: var(--md1-space-1);
  font-size: var(--md1-type-subhead-size);
  background: transparent;
  box-sizing: border-box;
}

/* ── Menu ────────────────────────────────────────────────────────────────
   Source: _card.scss .mdl-card__menu
   position: absolute; right: 16px; top: 16px
   Sits in the top-right corner of the card stacking context (z-index: 1).
   ──────────────────────────────────────────────────────────────────────── */
.md1-card__menu {
  position: absolute;
  top:   var(--md1-space-2);   /* 16px — $card-vertical-padding */
  right: var(--md1-space-2);   /* 16px — $card-horizontal-padding */
  white-space: nowrap;
}
</style>
