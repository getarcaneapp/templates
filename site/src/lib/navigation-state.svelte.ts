/** Shared between the layout's page transitions and the template cards. */
export const navigationState = $state({
  /**
   * The template whose card icon and title morph into (or back out of) the detail page header.
   * Only that one card gets a view-transition-name: naming all 131 cards makes the browser
   * snapshot every one of them and makes the transition back to the list lag.
   */
  morphId: null as string | null,
  /** Cards play their staggered entrance on the first page load only, not on every return. */
  animateCards: true,
  /**
   * The current template page was opened from the list, so "All templates" can go back in
   * history and land at the same scroll position and filters instead of the top of the list.
   */
  openedFromList: false,
});
