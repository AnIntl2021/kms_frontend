const fs = require('fs');

let roleContent = fs.readFileSync('src/pages/RoleManagementPage.tsx', 'utf8');

const replacements = {
  '"Role & Access Management"': '{t(\'role_access_management\')}',
  'Roles & Permissions': '{t(\'roles_permissions\')}',
  'System Login Users': '{t(\'system_login_users\')}',
  '<h2>Custom Access Roles</h2>': '<h2>{t(\'custom_access_roles\')}</h2>',
  '> Create Role': '> {t(\'create_role\')}',
  'Internal ID: ': '{t(\'internal_id\')}: ',
  'title="Edit Role"': 'title={t(\'edit_role\')}',
  'title="Delete Role"': 'title={t(\'delete_role\')}',
  'No Permissions': '{t(\'no_permissions\')}',
  '<h2>System Users</h2>': '<h2>{t(\'system_users\')}</h2>',
  '> Create User': '> {t(\'create_user\')}',
  '<th>Name</th>': '<th>{t(\'name\')}</th>',
  '<th>Username</th>': '<th>{t(\'username\')}</th>',
  '<th>Email</th>': '<th>{t(\'email\')}</th>',
  '<th>Role</th>': '<th>{t(\'role\')}</th>',
  '<th>Status</th>': '<th>{t(\'status\')}</th>',
  '<th>Actions</th>': '<th>{t(\'actions\')}</th>',
  'title="Edit User"': 'title={t(\'edit_user\')}',
  'Disable User': '{t(\'disable_user\')}',
  'Enable User': '{t(\'enable_user\')}',
  'title="Delete User"': 'title={t(\'delete_user\')}',
  "'Edit Role' : 'Create New Role'": "t('edit_role') : t('create_role')",
  'Role Name (No Spaces)': '{t(\'role_name\')}',
  'Display Name': '{t(\'display_name\')}',
  'Module Access Permissions': '{t(\'module_access_permissions\')}',
  '>Cancel<': '>{t(\'cancel\')}<',
  "'Update Role' : 'Save Role'": "t('update_role') : t('save_role')",
  "'Edit System User' : 'Create System Login User'": "t('edit_user') : t('create_user')",
  'First Name': '{t(\'first_name\')}',
  'Last Name': '{t(\'last_name\')}',
  'Password {': '{t(\'password\')} {',
  '(Leave blank to keep current)': '{t(\'leave_blank_keep_current\')}',
  'Assigned Role': '{t(\'assigned_role\')}',
  '>Select a Role...<': '>{t(\'select_role\')}<',
  '>Active<': '>{t(\'active\')}<',
  '>Inactive<': '>{t(\'inactive\')}<',
  "'Update User' : 'Create User'": "t('update_user') : t('create_user')"
};

for (const [key, value] of Object.entries(replacements)) {
  roleContent = roleContent.split(key).join(value);
}

fs.writeFileSync('src/pages/RoleManagementPage.tsx', roleContent);
console.log('Done role management');
