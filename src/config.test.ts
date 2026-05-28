import { StrKey } from '@stellar/stellar-sdk';
import { describe, expect, test } from 'vitest';
import { USDC_ISSUERS } from './config';

describe('USDC_ISSUERS', () => {
  test('uses valid Stellar public keys', () => {
    for (const issuer of Object.values(USDC_ISSUERS)) {
      expect(StrKey.isValidEd25519PublicKey(issuer)).toBe(true);
    }
  });
});
