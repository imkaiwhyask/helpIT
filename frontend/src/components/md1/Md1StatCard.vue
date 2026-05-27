<script setup>
import { computed } from 'vue'
import Md1Card from './Md1Card.vue'

const props = defineProps({
  label:       { type: String,           required: true },
  value:       { type: [String, Number], default: '–' },
  icon:        { type: String,           default: null },
  color:       { type: String,           default: 'var(--md1-primary)' },
  iconBg:      { type: String,           default: 'var(--md1-grey-100)' },
  delta:       { type: Number,           default: null },
  trend:       { type: String,           default: null },  // 'up' | 'down' | 'flat'
  interactive: { type: Boolean,          default: true },
  elevation:   { type: Number,           default: 2 },
})

const TREND_GLYPH = { up: '↑', down: '↓', flat: '→' }
const TREND_COLOR = {
  up:   'var(--md1-green-500)',
  down: 'var(--md1-red-500)',
  flat: 'var(--md1-text-secondary)',
}

const trendGlyph  = computed(() => TREND_GLYPH[props.trend] ?? '')
const trendColor  = computed(() => TREND_COLOR[props.trend] ?? 'var(--md1-text-secondary)')
const deltaPrefix = computed(() => props.delta != null && props.delta > 0 ? '+' : '')
const hasDelta    = computed(() => props.delta != null || !!props.trend)
</script>

<template>
  <!--
    Md1StatCard — metric tile composing Md1Card.
    Props:  label, value, icon (El-Plus name), color (accent + left border),
            iconBg (icon square bg), delta (signed number), trend ('up'|'down'|'flat'),
            interactive (default true), elevation (default 2)
    Events: forwards native click via fallthrough — parent handles navigation.
  -->
  <Md1Card
    class="md1-stat-card"
    :style="{ '--stat-accent': color }"
    :elevation="elevation"
    :interactive="interactive"
  >
    <div class="stat-inner">
      <div v-if="icon" class="stat-icon" :style="{ background: iconBg }">
        <el-icon :style="{ color }"><component :is="icon" /></el-icon>
      </div>
      <div class="stat-info">
        <!-- value: headline (24px / 400) — MDL $card-title-font-size -->
        <div class="stat-value">{{ value }}</div>
        <!-- label: caption (12px / 400) -->
        <div class="stat-label">{{ label }}</div>
        <!-- optional delta + trend indicator -->
        <div v-if="hasDelta" class="stat-delta" :style="{ color: trendColor }">
          <span v-if="delta != null">{{ deltaPrefix }}{{ delta }}</span>
          <span v-if="trend"> {{ trendGlyph }}</span>
        </div>
      </div>
    </div>
  </Md1Card>
</template>

<style scoped>
/* Left accent border — 3px so inner padding compensates on the left */
.md1-stat-card {
  border-left: 3px solid var(--stat-accent, var(--md1-primary));
}

/* Md1Card wraps default slot in .md1-card__body (padding: 16px).
   Stat card controls its own inner spacing, so we zero that out. */
.md1-stat-card :deep(.md1-card__body) {
  padding: 0;
}

/* 18px top/bottom, 16px right, 13px left (16px visual - 3px border = 13px) */
.stat-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px 18px 13px;
}

/* 44×44 icon square — matches existing stat-icon proportions */
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--md1-radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

/* Value: MDL headline scale (24px / 400) */
.stat-value {
  font-size:   var(--md1-type-headline-size);
  font-weight: var(--md1-type-headline-weight);
  color:       var(--md1-text-primary);
  line-height: 1;
}

/* Label: MDL caption scale (12px / 400) */
.stat-label {
  font-size:   var(--md1-type-caption-size);
  font-weight: var(--md1-type-caption-weight);
  color:       var(--md1-text-secondary);
  margin-top:  4px;
}

/* Delta / trend: caption size, weight 500 (body2 weight), colored by trend */
.stat-delta {
  font-size:   var(--md1-type-caption-size);
  font-weight: var(--md1-type-body2-weight);
  margin-top:  2px;
}
</style>
