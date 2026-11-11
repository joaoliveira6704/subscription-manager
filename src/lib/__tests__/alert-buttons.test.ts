import { MAX_ROW_LABEL_LENGTH, arrangeAlertButtons } from '@/lib/alert-buttons';

const cancel = { text: 'Cancel', style: 'cancel' as const };
const remove = { text: 'Delete', style: 'destructive' as const };
const other = { text: 'Archive' };

describe('arrangeAlertButtons', () => {
  it('adds a single OK button when none are given', () => {
    expect(arrangeAlertButtons(undefined, 'OK')).toEqual({
      layout: 'row',
      buttons: [{ text: 'OK' }],
    });
    expect(arrangeAlertButtons([], 'OK').buttons).toEqual([{ text: 'OK' }]);
  });

  it('puts cancel on the left of two side-by-side buttons, like iOS', () => {
    expect(arrangeAlertButtons([remove, cancel], 'OK')).toEqual({
      layout: 'row',
      buttons: [cancel, remove],
    });
    expect(arrangeAlertButtons([cancel, remove], 'OK').buttons).toEqual([cancel, remove]);
  });

  it('stacks three or more buttons with cancel at the bottom', () => {
    expect(arrangeAlertButtons([cancel, other, remove], 'OK')).toEqual({
      layout: 'column',
      buttons: [other, remove, cancel],
    });
  });

  it('keeps only the first cancel button', () => {
    const second = { text: 'Close', style: 'cancel' as const };
    expect(arrangeAlertButtons([cancel, second, remove], 'OK').buttons).toEqual([cancel, remove]);
  });

  it('stacks two buttons when a label is too long to share a row', () => {
    const long = { text: 'x'.repeat(MAX_ROW_LABEL_LENGTH + 1) };
    expect(arrangeAlertButtons([cancel, long], 'OK')).toEqual({
      layout: 'column',
      buttons: [long, cancel],
    });
  });

  it('keeps two buttons in a row when a label is exactly at the limit', () => {
    const atLimit = { text: 'x'.repeat(MAX_ROW_LABEL_LENGTH) };
    expect(arrangeAlertButtons([cancel, atLimit], 'OK').layout).toBe('row');
  });

  it('measures trimmed labels, so padding does not force a column', () => {
    const padded = { text: `   ${'x'.repeat(MAX_ROW_LABEL_LENGTH)}   ` };
    expect(arrangeAlertButtons([cancel, padded], 'OK').layout).toBe('row');
  });

  it('does not change the buttons it was given', () => {
    const buttons = [remove, cancel];
    arrangeAlertButtons(buttons, 'OK');
    expect(buttons).toEqual([remove, cancel]);
  });
});
