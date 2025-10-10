const fs = require('fs');
const path = require('path');
const tsconfig = (() => {
	try {
		return require('../tsconfig.json');
	} catch (error) {
		return {};
	}
})();

const aliasPatterns = Array.isArray(tsconfig?.compilerOptions?.paths?.['@/*'])
	? tsconfig.compilerOptions.paths['@/*']
	: [];

const fallbackPatterns = aliasPatterns.length > 0 ? aliasPatterns : ['./src/*', './app/*', './*'];

const globalMarker = '__JEST_CUSTOM_ALIAS_RESOLVER__';
if (!global[globalMarker]) {
	global[globalMarker] = true;
}

function findExistingPath(basePath, extensions) {
	if (fs.existsSync(basePath)) {
		const stats = fs.statSync(basePath);
		if (stats.isFile()) {
			return basePath;
		}
		if (stats.isDirectory()) {
			for (const ext of extensions) {
				const indexPath = path.join(basePath, `index${ext}`);
				if (fs.existsSync(indexPath)) {
					return indexPath;
				}
			}
		}
	}

	for (const ext of extensions) {
		const candidate = `${basePath}${ext}`;
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}

	return null;
}

function resolveAlias(request, options) {
	const suffix = request.slice(2); // remove '@/'
	for (const pattern of fallbackPatterns) {
		const patternPath = pattern.replace('*', suffix);
		const absolutePath = path.resolve(options.rootDir, patternPath);
		const resolvedPath = findExistingPath(absolutePath, options.extensions);
		if (resolvedPath) {
			return resolvedPath;
		}
	}

	return null;
}

module.exports = (request, options) => {
	const fallbackResolver =
		typeof options.defaultResolver === 'function'
			? options.defaultResolver
			: require('jest-resolve').default;

	if (request.startsWith('@/')) {
		const resolved = resolveAlias(request, options);
		if (resolved) {
			return resolved;
		}
	}

	return fallbackResolver(request, options);
};
