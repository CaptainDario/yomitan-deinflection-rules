/**
 * Mock implementations of Yomitan's language-transforms.js helper functions.
 *
 * Instead of building RegExp / closure objects, each function returns a plain
 * JSON-serialisable record so the caller (japanese-transforms.js) produces an
 * object that can be written directly to a .json file and consumed by Dart.
 *
 * Property naming matches what the Dart GrammarLoader expects:
 *   type         – identifies which inflection factory to call
 *   inflected    – the inflected form   (first argument)
 *   base         – the deinflected form (second argument)
 *   conditionsIn – array of condition strings
 *   conditionsOut– array of condition strings
 */

export function suffixInflection(inflectedSuffix, deinflectedSuffix, conditionsIn, conditionsOut) {
    return {
        type: 'suffix',
        inflected: inflectedSuffix,
        base: deinflectedSuffix,
        conditionsIn,
        conditionsOut,
    };
}

export function prefixInflection(inflectedPrefix, deinflectedPrefix, conditionsIn, conditionsOut) {
    return {
        type: 'prefix',
        inflected: inflectedPrefix,
        base: deinflectedPrefix,
        conditionsIn,
        conditionsOut,
    };
}

export function wholeWordInflection(inflectedWord, deinflectedWord, conditionsIn, conditionsOut) {
    return {
        type: 'wholeWord',
        inflected: inflectedWord,
        base: deinflectedWord,
        conditionsIn,
        conditionsOut,
    };
}
