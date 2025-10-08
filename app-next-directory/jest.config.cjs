// jest.config.cjs
// Jest config for TypeScript + ESM + React 18/19 compatible unit tests

// Convert to CommonJS-compatible synchronous config so Node can load this file
const path = require('path');
const fs = require('fs');

// Attempt to load pathsToModuleNameMapper from ts-jest if available. If not,
// fall back to a no-op mapper so the rest of the config still works.
let pathsToModuleNameMapper = () => ({});
try {
	// ts-jest may export this helper in CommonJS builds
	const tsJest = require('ts-jest');
	if (tsJest && typeof tsJest.pathsToModuleNameMapper === 'function') {
		pathsToModuleNameMapper = tsJest.pathsToModuleNameMapper;
	}
} catch (e) {
	// ignore - we'll fallback to an empty mapper
}

// Read tsconfig.json synchronously using __dirname so this file remains CJS.
let compilerOptions = {};
try {
	const tsconfigRaw = fs.readFileSync(path.resolve(__dirname, './tsconfig.json'), 'utf8');
	compilerOptions = JSON.parse(tsconfigRaw || '{}').compilerOptions || {};
} catch (e) {
	// ignore - leave compilerOptions empty
}

module.exports = {
		// Scope discovery to your source dirs in this package
		roots: ['<rootDir>/src', '<rootDir>/app'],

		// Transform with SWC and emit ESM so top-level await & unstable_mockModule work
		transform: {
			'^.+\\.(t|j)sx?$': [
				'@swc/jest',
				{
					jsc: {
						target: 'es2022',
						transform: { react: { runtime: 'automatic' } },
					},
					module: { type: 'es6' },
				},
			],
		},

		// Treat these as ESM inside Jest
		extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],

		testEnvironment: 'jsdom',
		testEnvironmentOptions: {
			customExportConditions: ['node', 'node-addons'],
		},

		setupFiles: ['<rootDir>/jest/setEnvVars.js'],
		setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/__mocks__/node.ts'],

		testMatch: [
			'<rootDir>/src/**/*.test.(ts|tsx|js|jsx)',
			'<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
			'<rootDir>/app/**/*.test.(ts|tsx|js|jsx)',
			'<rootDir>/app/**/__tests__/**/*.(ts|tsx|js|jsx)',
		],

		moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
		moduleDirectories: ['node_modules', '<rootDir>/node_modules'],

		moduleNameMapper: {
			// Common Next/DOM/library mocks – adjust paths if needed
			'^server-only$': '<rootDir>/__mocks__/server-only.js',
			'^tree-sitter-.*$': '<rootDir>/__mocks__/tree-sitter.js',
			'^next/link$': '<rootDir>/__mocks__/next/link.js',
			'^@/mocks/server$': '<rootDir>/__mocks__/server.ts',
			'^mocks/server$': '<rootDir>/__mocks__/server.ts',
			'^@sanity/client$': '<rootDir>/__mocks__/@sanity/client.ts',
			'^next-sanity$': '<rootDir>/__mocks__/next-sanity.js',
			'^mongoose$': '<rootDir>/__mocks__/mongoose.ts',
			'node-fetch': '<rootDir>/__mocks__/node-fetch.js',
			'^clsx$': '<rootDir>/__mocks__/clsx.js',
			'^embla-carousel-react$': '<rootDir>/__mocks__/embla-carousel-react.js',
			'^embla-carousel-autoplay$': '<rootDir>/__mocks__/embla-carousel-autoplay.js',
			'^leaflet$': '<rootDir>/__mocks__/leaflet.ts',
			'leaflet/dist/leaflet.css$': '<rootDir>/__mocks__/leaflet/dist/leaflet.css.js',
			'leaflet.markercluster/dist/MarkerCluster.css$': '<rootDir>/__mocks__/leaflet.markercluster/dist/MarkerCluster.css.js',
			'leaflet.markercluster/dist/MarkerCluster.Default.css$': '<rootDir>/__mocks__/leaflet.markercluster/dist/MarkerCluster.Default.css.js',
			'\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',

			// next-auth & providers mocks (if you still rely on them elsewhere)
			'^next-auth$': '<rootDir>/__mocks__/next-auth.js',
			'^next-auth/react$': '<rootDir>/__mocks__/next-auth/react.js',
			'^next-auth/jwt$': '<rootDir>/__mocks__/next-auth/jwt.js',
			'^next-auth/providers/credentials$': '<rootDir>/__mocks__/next-auth/providers/credentials.js',
			'^next-auth/providers/(.*)$': '<rootDir>/__mocks__/next-auth/providers/$1.js',
			'^@auth/core/providers/(.*)$': '<rootDir>/__mocks__/next-auth/providers/$1.js',
			'^@auth/mongodb-adapter$': '<rootDir>/__mocks__/@auth/mongodb-adapter.js',

			'^@/(.*)$': '<rootDir>/src/$1',
			'^@/__mocks__/(.*)$': '<rootDir>/__mocks__/$1',
			'^@/lib/dbConnect(?:\\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/dbConnect.js',
			'^@/models/User$': '<rootDir>/__mocks__/@/models/User.js',
			// '^@/lib/redis(?:\\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/redis.ts', // REMOVED: global Redis mock mapping for best practice
			'^@/lib/rate-limit(?:\\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/rate-limit.js',
			'^@/lib/logger(?:\\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/logger.js',

			// TS path aliases from tsconfig.json (resolved at runtime). If
			// ts-jest isn't available, this will be a no-op.
			...pathsToModuleNameMapper(compilerOptions && compilerOptions.paths ? compilerOptions.paths : {}, { prefix: '<rootDir>/' }),
		},

		transformIgnorePatterns: [
			// Allow ESM libs through transform
			'/node_modules/(?!(next-auth|@auth|jose|broadcast-channel)/)',
		],

		collectCoverageFrom: [
			'src/**/*.{ts,tsx,js,jsx}',
			'app/**/*.{ts,tsx,js,jsx}',
			'!src/**/*.d.ts',
			'!src/__mocks__/**/*',
			'!**/*.test.*',
			'!**/node_modules/**',
			'!**/*.config.*',
			'!**/middleware.*',
		],

		watchPathIgnorePatterns: ['^<rootDir>/tests/', '[\\/](playwright)[\\/]'],

		testPathIgnorePatterns: [
			'^<rootDir>/tests/',
			'[\\/](playwright)[\\/]',
			'[\\/]__tests__[\\/]__mocks__[\\/]',
			'\\.d(\\.test)?\\.ts$',
			'reporter\\.js$',
		],
	};
