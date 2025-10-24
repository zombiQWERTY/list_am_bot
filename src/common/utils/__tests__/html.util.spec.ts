import { escapeHtml } from '@list-am-bot/common/utils/html.util';

describe('escapeHtml', (): void => {
  it('should escape ampersand character', (): void => {
    const result = escapeHtml('Tom & Jerry');

    expect(result).toBe('Tom &amp; Jerry');
  });

  it('should escape less than character', (): void => {
    const result = escapeHtml('5 < 10');

    expect(result).toBe('5 &lt; 10');
  });

  it('should escape greater than character', (): void => {
    const result = escapeHtml('10 > 5');

    expect(result).toBe('10 &gt; 5');
  });

  it('should escape double quote character', (): void => {
    const result = escapeHtml('Say "Hello"');

    expect(result).toBe('Say &quot;Hello&quot;');
  });

  it('should escape multiple special characters', (): void => {
    const result = escapeHtml('<div class="test">Tom & Jerry</div>');

    expect(result).toBe(
      '&lt;div class=&quot;test&quot;&gt;Tom &amp; Jerry&lt;/div&gt;',
    );
  });

  it('should return empty string for empty input', (): void => {
    const result = escapeHtml('');

    expect(result).toBe('');
  });

  it('should not change text without special characters', (): void => {
    const result = escapeHtml('Hello World');

    expect(result).toBe('Hello World');
  });

  it('should escape ampersand first in chain', (): void => {
    const result = escapeHtml('&<>"');

    expect(result).toBe('&amp;&lt;&gt;&quot;');
  });

  it('should handle multiple ampersands', (): void => {
    const result = escapeHtml('A & B & C');

    expect(result).toBe('A &amp; B &amp; C');
  });

  it('should handle multiple quotes', (): void => {
    const result = escapeHtml('"Hello" "World"');

    expect(result).toBe('&quot;Hello&quot; &quot;World&quot;');
  });
});
