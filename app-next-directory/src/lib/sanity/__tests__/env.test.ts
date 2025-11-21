/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { isSanityConfigured, getSanityMissingEnvMessage } from '../env';

// Test constants to reduce duplication
const TEST_PROJECT_ID = 'test-project';
const TEST_DATASET = 'test-dataset';
const ENV_VAR_PROJECT_ID = 'NEXT_PUBLIC_SANITY_PROJECT_ID';
const ENV_VAR_DATASET = 'NEXT_PUBLIC_SANITY_DATASET';

describe('Sanity Environment Utilities', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original env vars
    process.env = { ...originalEnv };
  });

  describe('isSanityConfigured', () => {
    it('returns true when both NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET are set', () => {
      process.env[ENV_VAR_PROJECT_ID] = TEST_PROJECT_ID;
      process.env[ENV_VAR_DATASET] = TEST_DATASET;

      expect(isSanityConfigured()).toBe(true);
    });

    it('returns false when NEXT_PUBLIC_SANITY_PROJECT_ID is missing', () => {
      delete process.env[ENV_VAR_PROJECT_ID];
      process.env[ENV_VAR_DATASET] = TEST_DATASET;

      expect(isSanityConfigured()).toBe(false);
    });

    it('returns false when NEXT_PUBLIC_SANITY_DATASET is missing', () => {
      process.env[ENV_VAR_PROJECT_ID] = TEST_PROJECT_ID;
      delete process.env[ENV_VAR_DATASET];

      expect(isSanityConfigured()).toBe(false);
    });

    it('returns false when both variables are missing', () => {
      delete process.env[ENV_VAR_PROJECT_ID];
      delete process.env[ENV_VAR_DATASET];

      expect(isSanityConfigured()).toBe(false);
    });

    it('returns false when NEXT_PUBLIC_SANITY_PROJECT_ID is empty string', () => {
      process.env[ENV_VAR_PROJECT_ID] = '';
      process.env[ENV_VAR_DATASET] = TEST_DATASET;

      expect(isSanityConfigured()).toBe(false);
    });

    it('returns false when NEXT_PUBLIC_SANITY_DATASET is empty string', () => {
      process.env[ENV_VAR_PROJECT_ID] = TEST_PROJECT_ID;
      process.env[ENV_VAR_DATASET] = '';

      expect(isSanityConfigured()).toBe(false);
    });

    it('returns false when both variables are empty strings', () => {
      process.env[ENV_VAR_PROJECT_ID] = '';
      process.env[ENV_VAR_DATASET] = '';

      expect(isSanityConfigured()).toBe(false);
    });

    it('returns true with different valid dataset names', () => {
      const datasets = [TEST_DATASET, 'staging', 'development', 'test'];
      
      datasets.forEach(dataset => {
        process.env[ENV_VAR_PROJECT_ID] = 'test-project';
        process.env[ENV_VAR_DATASET] = dataset;
        expect(isSanityConfigured()).toBe(true);
      });
    });

    it('returns true with valid alphanumeric project IDs', () => {
      const projectIds = ['abc123', 'project-123', 'test_project', 'p1'];
      
      projectIds.forEach(projectId => {
        process.env[ENV_VAR_PROJECT_ID] = projectId;
        process.env[ENV_VAR_DATASET] = TEST_DATASET;
        expect(isSanityConfigured()).toBe(true);
      });
    });
  });

  describe('getSanityMissingEnvMessage', () => {
    it('returns the correct error message', () => {
      const message = getSanityMissingEnvMessage();
      expect(message).toBe('Sanity environment variables are not configured.');
    });

    it('returns consistent message on multiple calls', () => {
      const message1 = getSanityMissingEnvMessage();
      const message2 = getSanityMissingEnvMessage();
      expect(message1).toBe(message2);
    });

    it('returns a non-empty string', () => {
      const message = getSanityMissingEnvMessage();
      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
  });

  describe('Integration scenarios', () => {
    it('should indicate unconfigured state with missing env vars', () => {
      delete process.env[ENV_VAR_PROJECT_ID];
      delete process.env[ENV_VAR_DATASET];

      const isConfigured = isSanityConfigured();
      const message = getSanityMissingEnvMessage();

      expect(isConfigured).toBe(false);
      expect(message).toBe('Sanity environment variables are not configured.');
    });

    it('should indicate configured state with valid env vars', () => {
      process.env[ENV_VAR_PROJECT_ID] = 'my-project';
      process.env[ENV_VAR_DATASET] = TEST_DATASET;

      const isConfigured = isSanityConfigured();

      expect(isConfigured).toBe(true);
    });

    it('should handle switching between configured and unconfigured states', () => {
      // Start configured
      process.env[ENV_VAR_PROJECT_ID] = 'project-1';
      process.env[ENV_VAR_DATASET] = TEST_DATASET;
      expect(isSanityConfigured()).toBe(true);

      // Switch to unconfigured
      delete process.env[ENV_VAR_PROJECT_ID];
      expect(isSanityConfigured()).toBe(false);

      // Switch back to configured
      process.env[ENV_VAR_PROJECT_ID] = 'project-2';
      expect(isSanityConfigured()).toBe(true);
    });
  });
});
