import { describe, it, expect } from 'vitest';
import {
  phoneSchema,
  fatherNameSchema,
  registerSchema,
  completeProfileSchema,
} from './schemas';
import { missingProfileFields } from '@/store/auth-store';

/** The message a failed parse produced, for asserting we said the useful thing
 *  rather than a generic "invalid". */
function messageFor(value: unknown) {
  const r = phoneSchema.safeParse(value);
  return r.success ? null : r.error.issues[0].message;
}

describe('phoneSchema', () => {
  it('accepts a plain ten-digit Indian mobile number', () => {
    for (const n of ['9876543210', '8123456789', '7012345678', '6000000000']) {
      expect(phoneSchema.safeParse(n).success, n).toBe(true);
    }
  });

  it('names the leading zero specifically', () => {
    // The single most common way this field is filled in wrong — people prefix
    // a 0 out of landline habit. A generic "invalid number" leaves them
    // retyping the same thing.
    expect(messageFor('0987654321')).toMatch(/leading 0/i);
  });

  it('rejects a country code that the +91 beside the field already supplies', () => {
    expect(phoneSchema.safeParse('+919876543210').success).toBe(false);
    expect(phoneSchema.safeParse('919876543210').success).toBe(false);
  });

  it('requires exactly ten digits', () => {
    expect(messageFor('98765')).toMatch(/exactly 10/i);
    expect(messageFor('98765432101')).toMatch(/exactly 10/i);
  });

  it('rejects a first digit no Indian mobile number uses', () => {
    for (const n of ['1234567890', '5999999999', '2345678901']) {
      expect(messageFor(n), n).toMatch(/starts with 6, 7, 8 or 9/i);
    }
  });

  it('rejects anything that is not a digit', () => {
    expect(messageFor('98765 43210')).toMatch(/digits only/i);
    expect(messageFor('987654321a')).toMatch(/digits only/i);
  });

  it('rejects an empty value', () => {
    expect(messageFor('')).toMatch(/required/i);
  });
});

describe('fatherNameSchema', () => {
  it('accepts a real name and trims it', () => {
    expect(fatherNameSchema.parse('  Rajesh Sharma  ')).toBe('Rajesh Sharma');
  });

  it('rejects a value too short to be a name', () => {
    expect(fatherNameSchema.safeParse('R').success).toBe(false);
    expect(fatherNameSchema.safeParse('   ').success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = {
    full_name: 'Priya Sharma',
    father_name: 'Rajesh Sharma',
    phone: '9876543210',
    email: 'Priya@Example.COM',
    password: 'a-good-password',
  };

  it('accepts a complete sign-up and lower-cases the email', () => {
    const r = registerSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('priya@example.com');
  });

  it('requires every field the form shows', () => {
    for (const field of Object.keys(valid)) {
      const partial = { ...valid, [field]: '' };
      expect(registerSchema.safeParse(partial).success, field).toBe(false);
    }
  });
});

describe('completeProfileSchema', () => {
  it('asks for exactly the two fields an older account can be missing', () => {
    expect(
      completeProfileSchema.safeParse({
        father_name: 'Rajesh Sharma',
        phone: '9876543210',
      }).success
    ).toBe(true);
    expect(completeProfileSchema.safeParse({ phone: '9876543210' }).success).toBe(false);
  });
});

describe('missingProfileFields', () => {
  const base = {
    id: 'u1',
    email: 'a@b.com',
    full_name: 'A',
    father_name: 'Rajesh',
    phone: '9876543210',
    role: 'student',
    xp: 0,
    level: 1,
    is_premium: false,
  };

  it('finds nothing missing on a complete account', () => {
    expect(missingProfileFields(base)).toEqual([]);
  });

  it('reports each field an older account never supplied', () => {
    expect(missingProfileFields({ ...base, phone: null })).toEqual(['phone']);
    expect(missingProfileFields({ ...base, father_name: null })).toEqual([
      'father_name',
    ]);
    expect(
      missingProfileFields({ ...base, father_name: null, phone: null })
    ).toEqual(['father_name', 'phone']);
  });

  it('treats blank as missing, not answered', () => {
    // The trigger stores '' as NULL, but a value that slipped through as
    // whitespace must still be asked for rather than silently accepted.
    expect(missingProfileFields({ ...base, phone: '   ' })).toEqual(['phone']);
  });

  it('asks nothing of a signed-out visitor', () => {
    expect(missingProfileFields(null)).toEqual([]);
  });
});
