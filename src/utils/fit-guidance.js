/**
 * Pure helpers for slide fit guidance and author-facing recommendations.
 */

export function createIssue(kind, message, penalty) {
  return { kind, message, penalty };
}

export function toIssueKey(label) {
  return label.toLowerCase().replace(/\s+/g, '-');
}

export function calculateFitScore(issues) {
  const totalPenalty = issues.reduce((sum, issue) => sum + issue.penalty, 0);
  return Math.max(0, 100 - Math.min(totalPenalty, 92));
}

export function getFitSeverity(score) {
  if (score >= 94) {
    return 'strong';
  }
  if (score >= 85) {
    return 'good';
  }
  if (score >= 70) {
    return 'tight';
  }
  return 'crowded';
}

export function buildRecommendations(issues) {
  const kinds = new Set(issues.map(issue => issue.kind));
  const recommendations = [];

  if (kinds.has('slide-overflow-vertical')) {
    recommendations.push('Reduce total content or move one block to the next slide.');
  }
  if (kinds.has('slide-overflow-horizontal')) {
    recommendations.push('Narrow wide content, break long strings, or simplify the layout.');
  }
  if (kinds.has('dense-text')) {
    recommendations.push('Shorten copy, reduce bullet count, or split the narrative across two slides.');
  }
  if (kinds.has('dense-media')) {
    recommendations.push('Reduce one media block or dedicate a separate slide to the larger visual.');
  }
  if (kinds.has('mermaid-diagram-overflow')) {
    recommendations.push('Simplify the Mermaid diagram or move it to a dedicated diagram slide.');
  }
  if (kinds.has('code-block-overflow')) {
    recommendations.push('Trim the code sample or move detailed code to an appendix slide.');
  }
  if (kinds.has('table-overflow')) {
    recommendations.push('Reduce table rows or columns, or summarize the table visually.');
  }

  return recommendations.slice(0, 3);
}
