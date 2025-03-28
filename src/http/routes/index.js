"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = routes;
const active_agent_1 = require("http/core/agents/active-agent");
const authenticate_1 = require("http/core/agents/authenticate");
const get_all_1 = require("http/core/agents/get-all");
const get_profile_1 = require("http/core/agents/get-profile");
const inactive_agent_1 = require("http/core/agents/inactive-agent");
const logout_agent_1 = require("http/core/agents/logout-agent");
const request_password_recover_1 = require("http/core/agents/request-password-recover");
const reset_password_1 = require("http/core/agents/reset-password");
const update_agent_1 = require("http/core/agents/update-agent");
const cancel_service_1 = require("http/core/services/cancel-service");
const consult_lawyer_1 = require("http/core/services/consult-lawyer");
const create_service_1 = require("http/core/services/create-service");
const create_service_external_1 = require("http/core/services/create-service-external");
const create_type_service_1 = require("http/core/services/create-type-service");
const finished_service_1 = require("http/core/services/finished-service");
const get_all_quantity_services_1 = require("http/core/services/get-all-quantity-services");
const get_all_quantity_services_by_agent_1 = require("http/core/services/get-all-quantity-services-by-agent");
const get_all_quantity_services_in_month_1 = require("http/core/services/get-all-quantity-services-in-month");
const get_all_quantity_services_in_year_1 = require("http/core/services/get-all-quantity-services-in-year");
const get_all_services_1 = require("http/core/services/get-all-services");
const get_all_types_services_1 = require("http/core/services/get-all-types-services");
const get_all_types_services_without_pagination_1 = require("http/core/services/get-all-types-services-without-pagination");
const update_type_service_1 = require("http/core/services/update-type-service");
const create_account_1 = require("../core/agents/create-account");
const get_services_by_month_for_chart_1 = require("http/core/services/get-services-by-month-for-chart");
async function routes(app) {
    // Rotas de agents
    app.register(create_account_1.createAccountService);
    app.register(authenticate_1.authenticate);
    app.register(get_profile_1.getProfile);
    app.register(request_password_recover_1.requestPasswordRecover);
    app.register(reset_password_1.resetPassword);
    app.register(get_all_1.getAll);
    app.register(update_agent_1.updateAgent);
    app.register(inactive_agent_1.inactiveAgent);
    app.register(active_agent_1.activeAgent);
    app.register(logout_agent_1.logoutAgent);
    // Rotas de services types
    app.register(create_type_service_1.createTypeService);
    app.register(get_all_types_services_1.getAllTypesServices);
    app.register(update_type_service_1.updateTypeService);
    // Rotas de services
    app.register(create_service_1.createService);
    app.register(create_service_external_1.createServiceExternal);
    app.register(consult_lawyer_1.consultLawyer);
    app.register(get_all_services_1.getAllServices);
    app.register(finished_service_1.finishedService);
    app.register(cancel_service_1.cancelService);
    app.register(get_all_quantity_services_1.getAllQuantityServices);
    app.register(get_all_types_services_without_pagination_1.getAllTypesServicesWithoutPagination);
    app.register(get_all_quantity_services_in_month_1.getAllQuantityServicesInMonth);
    app.register(get_all_quantity_services_in_year_1.getAllQuantityServicesInYear);
    app.register(get_all_quantity_services_by_agent_1.getAllQuantityServicesByAgent);
    app.register(get_services_by_month_for_chart_1.getServicesByMonthForChart);
}
