import { describe, it, expect } from 'vitest';
import { billingConfigSchema } from './validations';

describe('Billing Validation', () => {
  it('validates professional tier', () => {
    const config = {
      tierName: 'Professional',
      price: '$299/mo',
      maxCameras: 50,
      maxVehicles: 10,
      maxProperties: 20,
      unlockedFeatures: ['gemini-3.5-flash', 'unlimited']
    };
    expect(billingConfigSchema.safeParse(config).success).toBe(true);
  });
});
