/* eslint-disable @typescript-eslint/no-var-requires */
// jest.node.config.cjs
// Jest config for Node.js environment tests

const path = require('path');
const fs = require('fs');

let pathsToModuleNameMapper = () => ({});
try {
	const tsJest = require('ts-jest');
	if (tsJest && typeof tsJest.pathsToModuleNameMapper === 'function') {
		pathsToModuleNameMapper = tsJest.pathsToModuleNameMapper;
	}
} catch (e) {
	// ignore
}

let compilerOptions = {};
try {
	const tsconfigRaw = fs.readFileSync(path.resolve(__dirname, './tsconfig.json'), 'utf8');
	compilerOptions = JSON.parse(tsconfigRaw || '{}').compilerOptions || {};
} catch (e) {
	// ignore
}

const useMockedMongoose = process.env.JEST_USE_REAL_MONGOOSE === '1' ? false : true;

const moduleNameMapper = {
	'^server-only$': '<rootDir>/__mocks__/server-only.js',
	'^tree-sitter-.*$': '<rootDir>/__mocks__/tree-sitter.js',
	'^next/link$': '<rootDir>/__mocks__/next/link.js',
	'^next/image$': '<rootDir>/__mocks__/next/image.js',
	'^next/font/google$': '<rootDir>/__mocks__/next/font/google.js',
	'^next/headers$': '<rootDir>/__mocks__/next/headers.js',
	'^@/mocks/server$': '<rootDir>/__mocks__/server.ts',
	'^mocks/server$': '<rootDir>/__mocks__/server.ts',
	'^@sanity/client$': '<rootDir>/__mocks__/@sanity/client.ts',
	'^next-sanity$': '<rootDir>/__mocks__/next-sanity.js',
	'node-fetch': '<rootDir>/__mocks__/node-fetch.js',
	'^clsx$': '<rootDir>/__mocks__/clsx.js',
	'^tailwind-merge$': '<rootDir>/__mocks__/tailwind-merge.js',
	'^embla-carousel-react$': '<rootDir>/__mocks__/embla-carousel-react.js',
	'^embla-carousel-autoplay$': '<rootDir>/__mocks__/embla-carousel-autoplay.js',
	'^leaflet$': '<rootDir>/__mocks__/leaflet.ts',
	'leaflet/dist/leaflet.css$': '<rootDir>/__mocks__/leaflet/dist/leaflet.css.js',
	'leaflet.markercluster/dist/MarkerCluster.css$': '<rootDir>/__mocks__/leaflet.markercluster/dist/MarkerCluster.css.js',
	'leaflet.markercluster/dist/MarkerCluster.Default.css$': '<rootDir>/__mocks__/leaflet.markercluster/dist/MarkerCluster.Default.css.js',
	'\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',

	'^next-auth$': '<rootDir>/__mocks__/next-auth.js',
	'^next-auth/react$': '<rootDir>/__mocks__/next-auth/react.js',
	'^next-auth/jwt$': '<rootDir>/__mocks__/next-auth/jwt.js',
	'^next-auth/providers/credentials$': '<rootDir>/__mocks__/next-auth/providers/credentials.js',
	'^next-auth/providers/(.*)$': '<rootDir>/__mocks__/next-auth/providers/$1.js',
	'^@auth/core/providers/(.*)$': '<rootDir>/__mocks__/next-auth/providers/$1.js',
	'^@auth/mongodb-adapter$': '<rootDir>/__mocks__/@auth/mongodb-adapter.js',

	'^@/(.*)$': '<rootDir>/src/$1',
	'^@/__mocks__/(.*)$': '<rootDir>/__mocks__/$1',
	'^@/lib/dbConnect(?:\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/dbConnect.js',
	'^@/models/User$': '<rootDir>/__mocks__/@/models/User.js',
	'^@/lib/rate-limit(?:\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/rate-limit.js',
	'^@/lib/logger(?:\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/logger.js',

	...pathsToModuleNameMapper(compilerOptions && compilerOptions.paths ? compilerOptions.paths : {}, { prefix: '<rootDir>/' }),
};

if (useMockedMongoose) {
	moduleNameMapper['^mongoose$'] = '<rootDir>/__mocks__/mongoose.ts';
}

module.exports = {
	roots: ['<rootDir>/src', '<rootDir>/app'],
	transform: {
		'^.+\.(t|j)sx?$': [
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
	extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
	testEnvironment: 'node',
	setupFiles: ['<rootDir>/jest/setEnvVars.js'],
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/__mocks__/node.ts'],
	globalSetup: '<rootDir>/jest/globalSetup.cjs',
	globalTeardown: '<rootDir>/jest/globalTeardown.cjs',
	testMatch: [
		'<rootDir>/src/utils/__tests__/sanitize.test.ts',
		'<rootDir>/src/utils/__tests__/rate-limit.test.ts',
		'<rootDir>/src/utils/__tests__/api-response.test.ts',
		'<rootDir>/src/utils/__tests__/priceRange.test.ts',
	],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
	moduleNameMapper,
	transformIgnorePatterns: [
		'/node_modules/(?!(next-auth|@auth|jose|broadcast-channel|msw|@mswjs|until-async|strict-event-emitter|@open-draft)/)',
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
	watchPathIgnorePatterns: ['^<rootDir>/tests/', '[\/](playwright)[\/]'],
	testPathIgnorePatterns: [
		'^<rootDir>/tests/',
		'[\/](playwright)[\/]',
		'[\/]__tests__[\/]__mocks__[\/]',
		'\.d(\.test)?\.ts$',
		'reporter\.js$',
	].concat(
		process.env.JEST_UNIT_ONLY === '1' || process.env.JEST_RUN_INTEGRATION !== '1'
			? ['\.(int|integration)\.test\.(ts|tsx|js|jsx)$']
			: []
	),
};
