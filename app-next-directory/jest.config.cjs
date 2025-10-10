// jest.config.cjs
// Jest config for TypeScript + ESM + React 18/19 compatible unit tests

// Convert to CommonJS-compatible synchronous config so Node can load this file
const path = require('path');
const fs = require('fs');

// Read tsconfig.json synchronously using __dirname so this file remains CJS.
let compilerOptions = {};
try {
	const tsconfigRaw = fs.readFileSync(path.resolve(__dirname, './tsconfig.json'), 'utf8');
	compilerOptions = JSON.parse(tsconfigRaw || '{}').compilerOptions || {};
} catch (e) {
	// ignore - leave compilerOptions empty
}

const swcJscConfig = {
	target: 'es2022',
	transform: { react: { runtime: 'automatic' } },
};

if (compilerOptions.baseUrl) {
	swcJscConfig.baseUrl = compilerOptions.baseUrl;
}

if (compilerOptions.paths) {
	swcJscConfig.paths = compilerOptions.paths;
}

module.exports = {
		// Scope discovery to your source dirs in this package
		roots: ['<rootDir>/src', '<rootDir>/app'],

		// Transform with SWC and emit ESM so top-level await & unstable_mockModule work
		transform: {
			'^.+\\.(t|j)sx?$': [
				'@swc/jest',
				{
					jsc: swcJscConfig,
					module: { type: 'es6' },
				},
			],
			'^.+\\.(css|less|scss|sass)$': '<rootDir>/jest/cssTransform.cjs',
		},

		// Treat these as ESM inside Jest
		extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],

		testEnvironment: 'jsdom',
		testEnvironmentOptions: {
			customExportConditions: ['node', 'node-addons'],
		},

		setupFiles: ['<rootDir>/jest/setEnvVars.js','<rootDir>/jest.setup.alias-mocks.ts'],
		setupFilesAfterEnv: (function(){
		  const arr = [process.env.JEST_UNIT_ONLY === '1' ? '<rootDir>/jest.setup.unit.ts' : '<rootDir>/jest.setup.min.ts']
		  if (process.env.JEST_ENABLE_MSW === '1' || process.env.JEST_UNIT_ONLY !== '1') {
		    arr.push('<rootDir>/__mocks__/node.ts')
		  }
		  return arr
		})(),

		testMatch: [
			'<rootDir>/src/**/*.test.(ts|tsx|js|jsx)',
			'<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
			'<rootDir>/app/**/*.test.(ts|tsx|js|jsx)',
			'<rootDir>/app/**/__tests__/**/*.(ts|tsx|js|jsx)',
		],

		moduleNameMapper: {
			'^server-only$': '<rootDir>/__mocks__/server-only.js',
		},

		moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
		moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
		resolver: path.resolve(__dirname, './jest/resolver.cjs'),

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
