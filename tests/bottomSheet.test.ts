import { assert, describe, it } from 'vitest';

import {
  clampDraggedBottomSheetHeight,
  computeSectionFramingPadding,
  getDefaultBottomSheetHeight,
  releaseBottomSheet,
} from '../domain/bottomSheet';

const PHONE_HEIGHT = 800;
// Téléphone en paysage : 90 % de l'écran reste au-dessus de la hauteur minimale.
const LANDSCAPE_PHONE_HEIGHT = 390;
// Fenêtre si basse que 90 % de l'écran passe sous la hauteur minimale.
const TINY_HEIGHT = 200;

// Toutes les hauteurs au pixel près, d'un peu moins que rien à un peu plus que l'écran : les règles
// sont vérifiées sur chacune plutôt que sur quelques exemples.
function everyHeightAround(viewportHeight: number): number[] {
  return Array.from({ length: viewportHeight + 101 }, (_, index) => index - 50);
}

describe('getDefaultBottomSheetHeight', () => {
  it('should_be_half_the_screen_when_opening', () => {
    assert.equal(getDefaultBottomSheetHeight(PHONE_HEIGHT), 400);
  });
});

describe('clampDraggedBottomSheetHeight', () => {
  it('should_keep_the_height_when_it_is_between_zero_and_ninety_percent', () => {
    assert.equal(clampDraggedBottomSheetHeight(500, PHONE_HEIGHT), 500);
  });

  it('should_stop_at_ninety_percent_of_the_screen_when_dragged_higher', () => {
    assert.equal(clampDraggedBottomSheetHeight(790, PHONE_HEIGHT), 720);
  });

  it('should_stop_at_zero_when_dragged_below_the_screen', () => {
    assert.equal(clampDraggedBottomSheetHeight(-30, PHONE_HEIGHT), 0);
  });

  it('should_stay_between_zero_and_ninety_percent_when_dragged_anywhere', () => {
    for (const viewportHeight of [PHONE_HEIGHT, LANDSCAPE_PHONE_HEIGHT, TINY_HEIGHT]) {
      for (const height of everyHeightAround(viewportHeight)) {
        const clampedHeight = clampDraggedBottomSheetHeight(height, viewportHeight);
        assert.isAtLeast(clampedHeight, 0, `hauteur ${height}, écran ${viewportHeight}`);
        assert.isAtMost(clampedHeight, viewportHeight * 0.9, `hauteur ${height}, écran ${viewportHeight}`);
      }
    }
  });
});

describe('releaseBottomSheet', () => {
  it('should_close_when_released_under_150_px', () => {
    assert.deepEqual(releaseBottomSheet(149, PHONE_HEIGHT), { kind: 'closed' });
  });

  it('should_stay_open_when_released_at_150_px', () => {
    assert.deepEqual(releaseBottomSheet(150, PHONE_HEIGHT), { kind: 'open', height: 200 });
  });

  it('should_rise_to_200_px_when_released_between_150_and_200_px', () => {
    assert.deepEqual(releaseBottomSheet(170, PHONE_HEIGHT), { kind: 'open', height: 200 });
  });

  it('should_keep_the_height_when_released_above_200_px', () => {
    assert.deepEqual(releaseBottomSheet(530, PHONE_HEIGHT), { kind: 'open', height: 530 });
  });

  it('should_not_exceed_ninety_percent_when_the_screen_is_tiny', () => {
    assert.deepEqual(releaseBottomSheet(170, TINY_HEIGHT), { kind: 'open', height: 180 });
  });

  it('should_close_exactly_when_released_under_150_px_whatever_the_height', () => {
    for (const viewportHeight of [PHONE_HEIGHT, LANDSCAPE_PHONE_HEIGHT, TINY_HEIGHT]) {
      for (const height of everyHeightAround(viewportHeight)) {
        const draggedHeight = clampDraggedBottomSheetHeight(height, viewportHeight);
        const release = releaseBottomSheet(draggedHeight, viewportHeight);
        assert.equal(release.kind === 'closed', draggedHeight < 150, `hauteur ${height}, écran ${viewportHeight}`);
      }
    }
  });

  it('should_open_between_200_px_and_ninety_percent_when_released_open', () => {
    for (const viewportHeight of [PHONE_HEIGHT, LANDSCAPE_PHONE_HEIGHT]) {
      for (const height of everyHeightAround(viewportHeight)) {
        const release = releaseBottomSheet(clampDraggedBottomSheetHeight(height, viewportHeight), viewportHeight);
        if (release.kind === 'open') {
          assert.isAtLeast(release.height, 200, `hauteur ${height}, écran ${viewportHeight}`);
          assert.isAtMost(release.height, viewportHeight * 0.9, `hauteur ${height}, écran ${viewportHeight}`);
        }
      }
    }
  });
});

describe('computeSectionFramingPadding', () => {
  it('should_leave_the_same_margin_on_every_side_when_the_panel_is_on_the_side', () => {
    assert.deepEqual(computeSectionFramingPadding('side-panel', PHONE_HEIGHT), {
      top: 60,
      right: 60,
      bottom: 60,
      left: 60,
    });
  });

  it('should_frame_above_the_half_open_bottom_sheet_when_the_panel_is_a_bottom_sheet', () => {
    assert.deepEqual(computeSectionFramingPadding('bottom-sheet', PHONE_HEIGHT), {
      top: 60,
      right: 60,
      bottom: 460,
      left: 60,
    });
  });
});
