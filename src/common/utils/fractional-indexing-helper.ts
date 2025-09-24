export class FractionalIndexingHelper {
  private static readonly BASE = 36;
  private static readonly DIGIT_SET = '0123456789abcdefghijklmnopqrstuvwxyz';

  static generateIndex(before?: string, after?: string): string {
    if (!before && !after) {
      return 'a0';
    }
    if (!before && after) {
      return this.generateBefore(after);
    }

    if (before && !after) {
      return this.generateAfter(before);
    }

    return this.generateBetween(before!, after!);
  }

  static generateAfter(position: string): string {
    if (!position) return 'a0';

    const lastChar = position[position.length - 1];
    const lastIndex = this.DIGIT_SET.indexOf(lastChar);

    if (lastIndex < this.DIGIT_SET.length - 1) {
      return position.slice(0, -1) + this.DIGIT_SET[lastIndex + 1];
    }

    return position + '0';
  }

  static generateBefore(after: string): string {
    if (after <= 'a0') {
      throw new Error('Cannot generate index before minimum value');
    }

    const midpoint = this.getMidpoint('', after);
    return midpoint || this.decrementString(after);
  }

  static generateSequentialAfter(
    startPosition: string,
    count: number,
  ): string[] {
    const positions: string[] = [];
    let currentPosition = startPosition;

    for (let i = 0; i < count; i++) {
      currentPosition = this.generateAfter(currentPosition);
      positions.push(currentPosition);
    }

    return positions;
  }

  static generateSequential(count: number, startFrom: string = 'a'): string[] {
    const positions: string[] = [];

    for (let i = 0; i < count; i++) {
      positions.push(`${startFrom}${i.toString(36)}`);
    }

    return positions;
  }

  static isValidPosition(position: string): boolean {
    if (!position || position.length === 0) return false;

    for (const char of position) {
      if (!this.DIGIT_SET.includes(char)) {
        return false;
      }
    }

    return true;
  }

  static compare(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  static sortPositions(positions: string[]): string[] {
    return positions.sort((a, b) => this.compare(a, b));
  }

  private static generateBetween(before: string, after: string): string {
    if (before >= after) {
      throw new Error('Before index must be less than after index');
    }

    const midpoint = this.getMidpoint(before, after);
    if (!midpoint) {
      return before + '0';
    }

    return midpoint;
  }

  private static getMidpoint(before: string, after: string): string | null {
    const maxLength = Math.max(before.length, after.length);
    const beforePadded = before.padEnd(maxLength, '0');
    const afterPadded = after.padEnd(maxLength, '0');

    for (let i = 0; i < maxLength; i++) {
      const beforeChar = beforePadded[i];
      const afterChar = afterPadded[i];
      const beforeVal = this.DIGIT_SET.indexOf(beforeChar);
      const afterVal = this.DIGIT_SET.indexOf(afterChar);

      if (afterVal - beforeVal > 1) {
        const midVal = Math.floor((beforeVal + afterVal) / 2);
        const midChar = this.DIGIT_SET[midVal];
        return beforePadded.substring(0, i) + midChar;
      }
    }

    return null;
  }

  private static decrementString(str: string): string {
    if (!str || str === '0') {
      throw new Error('Cannot decrement minimum string');
    }

    const lastChar = str[str.length - 1];
    const lastIndex = this.DIGIT_SET.indexOf(lastChar);

    if (lastIndex > 0) {
      return str.slice(0, -1) + this.DIGIT_SET[lastIndex - 1] + 'z';
    }
    if (str.length === 1) {
      throw new Error('Cannot decrement further');
    }

    return this.decrementString(str.slice(0, -1)) + 'z';
  }
}
