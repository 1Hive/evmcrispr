import type { Parser } from 'arcsecond';
import {
  between,
  char,
  choice,
  coroutine,
  many,
  possibly,
  recursiveParser,
  regex,
  sepBy,
  sequenceOf,
} from 'arcsecond';

export const endOfLine = char('\n');

// Overwrite arcsecond's parser as it ignores newline character
export const whitespace = regex(/^ +/);

export const optionalWhitespace = possibly(whitespace);

export const emptyLine = sequenceOf([possibly(whitespace), endOfLine]).map(
  () => null,
);

export const enclosedBy = (
  openingChar: string,
  closingChar: string,
  parser: Parser<any, any, any>,
): Parser<any, string, any> =>
  coroutine(function* () {
    yield char(openingChar);
    yield optionalWhitespace;

    const res = yield parser;
    yield optionalWhitespace;
    yield char(closingChar);

    return res;
  });
// between(surroundedBy(optionalWhitespace)(char(openingChar)))(
//   surroundedBy(optionalWhitespace)(char(closingChar)),
// )(parser);

export const surroundedBy = (
  parser: Parser<any, any, any>,
): ((p: Parser<unknown, string, any>) => Parser<unknown, any, any>) =>
  between(parser)(parser);

export const commaSeparated: any = sepBy(
  surroundedBy(optionalWhitespace)(char(',')),
);

export const optionalEmptyLines = (
  p: Parser<any, string, any>,
): Parser<any, string, any> =>
  recursiveParser(() =>
    coroutine(function* () {
      const lines = (yield many(choice([emptyLine, p]))) ?? [];

      return lines.filter((l: any) => !!l);
    }),
  );
