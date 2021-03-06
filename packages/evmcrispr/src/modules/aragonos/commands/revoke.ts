import type { ActionFunction, Entity } from '../../..';
import { ErrorNotFound } from '../../../errors';
import type { ConnectedAragonOS } from '../AragonOS';
import { resolvePermission } from '../utils/acl';

/**
 * Encode an action that revokes an app permission.
 * @param permission The permission to revoke.
 * @param removeManager A boolean that indicates whether or not to remove the permission manager.
 * @returns A function that returns the revoking actions.
 */
export function revoke(
  module: ConnectedAragonOS,
  grantee: Entity,
  app: Entity,
  role: string,
  removeManager = false,
): ActionFunction {
  return async () => {
    const actions = [];
    const [entityAddress, appAddress, roleHash] = resolvePermission(
      module.evm,
      [grantee, app, role],
    );
    const { permissions: appPermissions } = module.resolveApp(app);
    const { address: aclAddress, abiInterface: aclAbiInterface } =
      module.resolveApp('acl');

    if (!appPermissions.has(roleHash)) {
      throw new ErrorNotFound(
        `Permission ${role} doesn't exists in app ${app}.`,
      );
    }

    const appPermission = appPermissions.get(roleHash)!;

    if (!appPermission.grantees.has(entityAddress)) {
      throw new ErrorNotFound(
        `Entity ${grantee} doesn't have permission ${role} to be revoked.`,
        {
          name: 'ErrorPermissionNotFound',
        },
      );
    }

    appPermission.grantees.delete(entityAddress);

    actions.push({
      to: aclAddress,
      data: aclAbiInterface.encodeFunctionData('revokePermission', [
        entityAddress,
        appAddress,
        roleHash,
      ]),
    });

    if (removeManager) {
      delete appPermission.manager;
      actions.push({
        to: aclAddress,
        data: aclAbiInterface.encodeFunctionData('removePermissionManager', [
          appAddress,
          roleHash,
        ]),
      });
    }

    return actions;
  };
}
