package middleware

import "gitlab.yurtal.tech/company/maryai/back/internal/model"

var (
	RolesAdminOnly = []string{
		model.RoleAdmin,
		model.RoleManager,
		model.RoleSuperAdmin,
	}
	RolesCanActivateOrder = []string{
		model.RoleWaiter,
		model.RoleCashier,
		model.RoleAdmin,
		model.RoleManager,
		model.RoleSuperAdmin,
	}

	RolesCanCreateOrder = []string{
		model.RoleWaiter,
		model.RoleCashier,
		model.RoleAdmin,
		model.RoleManager,
		model.RoleSuperAdmin,
	}

	RolesCanPayOrder = []string{
		model.RoleCashier,
		model.RoleAdmin,
		model.RoleManager,
		model.RoleSuperAdmin,
	}

	RolesCanManageKitchen = []string{
		model.RoleKitchen,
		model.RoleAdmin,
		model.RoleManager,
		model.RoleSuperAdmin,
	}

	RolesCanReadPOSOrders = []string{
		model.RoleWaiter,
		model.RoleCashier,
		model.RoleAdmin,
		model.RoleManager,
		model.RoleSuperAdmin,
	}

	RolesCanReadCashierOrders = []string{
		model.RoleWaiter,
		model.RoleCashier,
		model.RoleAdmin,
		model.RoleManager,
		model.RoleSuperAdmin,
	}

	RolesCanServeOrder = []string{
		model.RoleWaiter,
		model.RoleAdmin,
		model.RoleManager,
		model.RoleSuperAdmin,
	}

	RolesCanOperateCashRegister = []string{
		model.RoleCashier,
		model.RoleAdmin,
		model.RoleManager,
		model.RoleSuperAdmin,
	}

	RolesCanReadOrderItemsStatus = []string{
		model.RoleWaiter,
		model.RoleCashier,
		model.RoleKitchen,
		model.RoleAdmin,
		model.RoleManager,
		model.RoleSuperAdmin,
	}

	RolesCanControlTableTimer = []string{
		model.RoleWaiter,
		model.RoleCashier,
		model.RoleAdmin,
		model.RoleManager,
		model.RoleSuperAdmin,
	}
)
