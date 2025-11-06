export const ROLES = {
  ADMIN: 'administrator',
  EDITOR: 'editor',
  CONTRIBUTOR: 'contributor'
};

export const USERS = {
  admin: {
    email: 'admin@example.com',
    password: process.env.TEST_ADMIN_PASSWORD
  },
  editor: {
    email: 'editor@example.com',
    password: process.env.TEST_EDITOR_PASSWORD
  },
  contributor: {
    email: 'contributor@example.com',
    password: process.env.TEST_CONTRIBUTOR_PASSWORD
  }
};

export const PERMISSIONS = {
  [ROLES.ADMIN]: {
    'user-management': true,
    'system-settings': true,
    'create-content': true,
    'publish-content': true,
    'delete-content': true
  },
  [ROLES.EDITOR]: {
    'user-management': false,
    'system-settings': false,
    'create-content': true,
    'publish-content': true,
    'delete-content': false
  },
  [ROLES.CONTRIBUTOR]: {
    'user-management': false,
    'system-settings': false,
    'create-content': true,
    'publish-content': false,
    'delete-content': false
  }
};
