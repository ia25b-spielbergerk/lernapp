import { describe, it, expect } from 'vitest';
import { isCloseEnough, shuffle, generateId } from './utils';

describe('isCloseEnough', () => {
  it('exakte Übereinstimmung gibt true zurück', () => {
    expect(isCloseEnough('hello', 'hello')).toBe(true);
  });

  it('ist case-insensitiv', () => {
    expect(isCloseEnough('Hello', 'hello')).toBe(true);
  });

  it('ignoriert Leerzeichen am Rand', () => {
    expect(isCloseEnough(' hello ', 'hello')).toBe(true);
  });

  it('1 Tippfehler bei kurzem Wort (≤4 Zeichen) erlaubt', () => {
    expect(isCloseEnough('bat', 'cat')).toBe(true);
  });

  it('2 Tippfehler bei kurzem Wort (≤4 Zeichen) abgelehnt', () => {
    expect(isCloseEnough('bxt', 'cat')).toBe(false);
  });

  it('1 Tippfehler bei langem Wort (>4 Zeichen) erlaubt', () => {
    expect(isCloseEnough('helo', 'hello')).toBe(true);
  });

  it('2 Tippfehler bei langem Wort (>4 Zeichen) erlaubt', () => {
    expect(isCloseEnough('hxllx', 'hello')).toBe(true);
  });

  it('3 Tippfehler bei langem Wort abgelehnt', () => {
    expect(isCloseEnough('hxlxz', 'hello')).toBe(false);
  });

  it('komplett falsche Antwort abgelehnt', () => {
    expect(isCloseEnough('xyz', 'hello')).toBe(false);
  });

  it('leere Eingabe bei nichtleerem Wort abgelehnt', () => {
    expect(isCloseEnough('', 'hello')).toBe(false);
  });
});

describe('shuffle', () => {
  it('gibt ein Array gleicher Länge zurück', () => {
    expect(shuffle([1, 2, 3, 4, 5])).toHaveLength(5);
  });

  it('enthält dieselben Elemente wie das Original', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('verändert das Original-Array nicht', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });

  it('gibt leeres Array für leeres Array zurück', () => {
    expect(shuffle([])).toEqual([]);
  });
});

describe('generateId', () => {
  it('gibt einen nicht-leeren String zurück', () => {
    expect(generateId()).toBeTruthy();
  });

  it('generiert jedes Mal eine andere ID', () => {
    expect(generateId()).not.toBe(generateId());
  });
});
