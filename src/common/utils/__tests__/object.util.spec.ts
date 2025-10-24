import { assignDefinedProps } from '@list-am-bot/common/utils/object.util';

describe('assignDefinedProps', (): void => {
  interface TestObject {
    name: string;
    age: number;
    email: string;
  }

  let target: TestObject;

  beforeEach((): void => {
    target = {
      name: 'John',
      age: 30,
      email: 'john@example.com',
    };
  });

  it('should assign defined property from source to target', (): void => {
    const source = { name: 'Jane' };

    assignDefinedProps(target, source, ['name']);

    expect(target.name).toBe('Jane');
  });

  it('should not modify other properties', (): void => {
    const source = { name: 'Jane' };

    assignDefinedProps(target, source, ['name']);

    expect(target.age).toBe(30);
  });

  it('should skip undefined properties', (): void => {
    const source = { name: undefined };

    assignDefinedProps(target, source, ['name']);

    expect(target.name).toBe('John');
  });

  it('should assign multiple defined properties', (): void => {
    const source = { name: 'Jane', age: 25 };

    assignDefinedProps(target, source, ['name', 'age']);

    expect(target.name).toBe('Jane');
  });

  it('should assign second property when multiple keys provided', (): void => {
    const source = { name: 'Jane', age: 25 };

    assignDefinedProps(target, source, ['name', 'age']);

    expect(target.age).toBe(25);
  });

  it('should skip undefined in multiple properties', (): void => {
    const source = { name: 'Jane', age: undefined };

    assignDefinedProps(target, source, ['name', 'age']);

    expect(target.age).toBe(30);
  });

  it('should assign all properties when all are defined', (): void => {
    const source = { name: 'Jane', age: 25, email: 'jane@example.com' };

    assignDefinedProps(target, source, ['name', 'age', 'email']);

    expect(target).toStrictEqual({
      name: 'Jane',
      age: 25,
      email: 'jane@example.com',
    });
  });

  it('should handle empty keys array', (): void => {
    const source = { name: 'Jane' };

    assignDefinedProps(target, source, []);

    expect(target.name).toBe('John');
  });

  it('should handle empty source object', (): void => {
    const source = {};

    assignDefinedProps(target, source, ['name']);

    expect(target.name).toBe('John');
  });

  it('should assign only specified keys', (): void => {
    const source = { name: 'Jane', age: 25, email: 'jane@example.com' };

    assignDefinedProps(target, source, ['name']);

    expect(target.email).toBe('john@example.com');
  });
});
