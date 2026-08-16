// GENERATED CODE - DO NOT MODIFY BY HAND
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'intl/messages_all.dart';

// **************************************************************************
// Generator: Flutter Intl IDE plugin
// Made by Localizely
// **************************************************************************

// ignore_for_file: non_constant_identifier_names, lines_longer_than_80_chars
// ignore_for_file: join_return_with_assignment, prefer_final_in_for_each
// ignore_for_file: avoid_redundant_argument_values, avoid_escaping_inner_quotes

class S {
  S();

  static S? _current;

  static S get current {
    assert(_current != null,
        'No instance of S was loaded. Try to initialize the S delegate before accessing S.current.');
    return _current!;
  }

  static const AppLocalizationDelegate delegate = AppLocalizationDelegate();

  static Future<S> load(Locale locale) {
    final name = (locale.countryCode?.isEmpty ?? false)
        ? locale.languageCode
        : locale.toString();
    final localeName = Intl.canonicalizedLocale(name);
    return initializeMessages(localeName).then((_) {
      Intl.defaultLocale = localeName;
      final instance = S();
      S._current = instance;

      return instance;
    });
  }

  static S of(BuildContext context) {
    final instance = S.maybeOf(context);
    assert(instance != null,
        'No instance of S present in the widget tree. Did you add S.delegate in localizationsDelegates?');
    return instance!;
  }

  static S? maybeOf(BuildContext context) {
    return Localizations.of<S>(context, S);
  }

  /// `Error accessing cache`
  String get strFailureMessage_cache {
    return Intl.message(
      'Error accessing cache',
      name: 'strFailureMessage_cache',
      desc: '',
      args: [],
    );
  }

  /// `An unknown error occurred`
  String get strFailureMessage_unknown {
    return Intl.message(
      'An unknown error occurred',
      name: 'strFailureMessage_unknown',
      desc: '',
      args: [],
    );
  }

  /// `A parsing error occurred`
  String get strFailureMessage_parsing {
    return Intl.message(
      'A parsing error occurred',
      name: 'strFailureMessage_parsing',
      desc: '',
      args: [],
    );
  }

  /// `A server error occurred`
  String get strFailureMessage_server {
    return Intl.message(
      'A server error occurred',
      name: 'strFailureMessage_server',
      desc: '',
      args: [],
    );
  }

  /// `You appear to be offline, please check your network connection`
  String get strFailureMessage_connection {
    return Intl.message(
      'You appear to be offline, please check your network connection',
      name: 'strFailureMessage_connection',
      desc: '',
      args: [],
    );
  }

  /// `Connection timed out, the network may be slow or busy`
  String get strFailureMessage_timeout {
    return Intl.message(
      'Connection timed out, the network may be slow or busy',
      name: 'strFailureMessage_timeout',
      desc: '',
      args: [],
    );
  }

  /// `The requested data was not found or does not exist`
  String get strFailureMessage_notFound {
    return Intl.message(
      'The requested data was not found or does not exist',
      name: 'strFailureMessage_notFound',
      desc: '',
      args: [],
    );
  }

  /// `An unexpected error occurred`
  String get strFailureMessage_other {
    return Intl.message(
      'An unexpected error occurred',
      name: 'strFailureMessage_other',
      desc: '',
      args: [],
    );
  }

  /// `Authentication failed, please log in again`
  String get strFailureMessage_unauthorized {
    return Intl.message(
      'Authentication failed, please log in again',
      name: 'strFailureMessage_unauthorized',
      desc: '',
      args: [],
    );
  }

  /// `Validation error, please check your fields`
  String get strFailureMessage_validation {
    return Intl.message(
      'Validation error, please check your fields',
      name: 'strFailureMessage_validation',
      desc: '',
      args: [],
    );
  }

  /// `You are not logged in, please sign in first`
  String get strFailureMessage_unauthenticated {
    return Intl.message(
      'You are not logged in, please sign in first',
      name: 'strFailureMessage_unauthenticated',
      desc: '',
      args: [],
    );
  }

  /// `An error occurred when logging in via Firebase`
  String get strFailureMessage_firebaseAuthFailure {
    return Intl.message(
      'An error occurred when logging in via Firebase',
      name: 'strFailureMessage_firebaseAuthFailure',
      desc: '',
      args: [],
    );
  }

  /// `An error occurred while initializing the app`
  String get strFailureMessage_initializingFailure {
    return Intl.message(
      'An error occurred while initializing the app',
      name: 'strFailureMessage_initializingFailure',
      desc: '',
      args: [],
    );
  }

  /// `Internal server error. Please try again in a moment.`
  String get strServerUnreachable500 {
    return Intl.message(
      'Internal server error. Please try again in a moment.',
      name: 'strServerUnreachable500',
      desc: '',
      args: [],
    );
  }

  /// `Server is not responding. Please try again in a moment.`
  String get strServerUnreachable502 {
    return Intl.message(
      'Server is not responding. Please try again in a moment.',
      name: 'strServerUnreachable502',
      desc: '',
      args: [],
    );
  }

  /// `Service is temporarily unavailable. Please try again in a moment.`
  String get strServerUnreachable503 {
    return Intl.message(
      'Service is temporarily unavailable. Please try again in a moment.',
      name: 'strServerUnreachable503',
      desc: '',
      args: [],
    );
  }

  /// `Server took too long to respond. Check your internet and try again.`
  String get strServerUnreachable504 {
    return Intl.message(
      'Server took too long to respond. Check your internet and try again.',
      name: 'strServerUnreachable504',
      desc: '',
      args: [],
    );
  }

  /// `Could not reach the server. Please try again in a moment.`
  String get strServerUnreachableGeneric {
    return Intl.message(
      'Could not reach the server. Please try again in a moment.',
      name: 'strServerUnreachableGeneric',
      desc: '',
      args: [],
    );
  }

  /// `Please check your internet connection`
  String get strCheckInternetConnection {
    return Intl.message(
      'Please check your internet connection',
      name: 'strCheckInternetConnection',
      desc: '',
      args: [],
    );
  }

  /// `No internet connection`
  String get strNoInternetConnection {
    return Intl.message(
      'No internet connection',
      name: 'strNoInternetConnection',
      desc: '',
      args: [],
    );
  }

  /// `Yes`
  String get strYes {
    return Intl.message(
      'Yes',
      name: 'strYes',
      desc: '',
      args: [],
    );
  }

  /// `No`
  String get strNo {
    return Intl.message(
      'No',
      name: 'strNo',
      desc: '',
      args: [],
    );
  }

  /// `No data found`
  String get strNoDataFound {
    return Intl.message(
      'No data found',
      name: 'strNoDataFound',
      desc: '',
      args: [],
    );
  }

  /// `Pull down to refresh`
  String get strPullDownToRefresh {
    return Intl.message(
      'Pull down to refresh',
      name: 'strPullDownToRefresh',
      desc: '',
      args: [],
    );
  }

  /// `Release to refresh`
  String get strReleaseToRefresh {
    return Intl.message(
      'Release to refresh',
      name: 'strReleaseToRefresh',
      desc: '',
      args: [],
    );
  }

  /// `Refreshing data...`
  String get strRefreshing {
    return Intl.message(
      'Refreshing data...',
      name: 'strRefreshing',
      desc: '',
      args: [],
    );
  }

  /// `Refresh complete`
  String get strRefreshCompleted {
    return Intl.message(
      'Refresh complete',
      name: 'strRefreshCompleted',
      desc: '',
      args: [],
    );
  }

  /// `Refresh failed`
  String get strRefreshFailed {
    return Intl.message(
      'Refresh failed',
      name: 'strRefreshFailed',
      desc: '',
      args: [],
    );
  }

  /// `Retry`
  String get strRetry {
    return Intl.message(
      'Retry',
      name: 'strRetry',
      desc: '',
      args: [],
    );
  }

  /// `This field cannot be empty`
  String get strFieldCannotBeEmpty {
    return Intl.message(
      'This field cannot be empty',
      name: 'strFieldCannotBeEmpty',
      desc: '',
      args: [],
    );
  }

  /// `Password must be at least 8 characters.`
  String get strPasswordContainAtLeastChars {
    return Intl.message(
      'Password must be at least 8 characters.',
      name: 'strPasswordContainAtLeastChars',
      desc: '',
      args: [],
    );
  }

  /// `Invalid number`
  String get strInvalidNumber {
    return Intl.message(
      'Invalid number',
      name: 'strInvalidNumber',
      desc: '',
      args: [],
    );
  }

  /// `Wrong phone number or password`
  String get strPhoneOrPasswordWrong {
    return Intl.message(
      'Wrong phone number or password',
      name: 'strPhoneOrPasswordWrong',
      desc: '',
      args: [],
    );
  }

  /// `Continue`
  String get strContinue {
    return Intl.message(
      'Continue',
      name: 'strContinue',
      desc: '',
      args: [],
    );
  }

  /// `App language`
  String get strAppLanguage {
    return Intl.message(
      'App language',
      name: 'strAppLanguage',
      desc: '',
      args: [],
    );
  }

  /// `Logout`
  String get strLogout {
    return Intl.message(
      'Logout',
      name: 'strLogout',
      desc: '',
      args: [],
    );
  }

  /// `Do you want to logout?`
  String get strDoYouWantToLogout {
    return Intl.message(
      'Do you want to logout?',
      name: 'strDoYouWantToLogout',
      desc: '',
      args: [],
    );
  }

  /// `Profile`
  String get strProfile {
    return Intl.message(
      'Profile',
      name: 'strProfile',
      desc: '',
      args: [],
    );
  }

  /// `Invalid name`
  String get strInvalidName {
    return Intl.message(
      'Invalid name',
      name: 'strInvalidName',
      desc: '',
      args: [],
    );
  }

  /// `Name is too short`
  String get strNameTooShort {
    return Intl.message(
      'Name is too short',
      name: 'strNameTooShort',
      desc: '',
      args: [],
    );
  }

  /// `Invalid date`
  String get strInvalidDate {
    return Intl.message(
      'Invalid date',
      name: 'strInvalidDate',
      desc: '',
      args: [],
    );
  }

  /// `Unacceptable date`
  String get strUnacceptableDate {
    return Intl.message(
      'Unacceptable date',
      name: 'strUnacceptableDate',
      desc: '',
      args: [],
    );
  }

  /// `Passwords do not match`
  String get strPasswordsNotSame {
    return Intl.message(
      'Passwords do not match',
      name: 'strPasswordsNotSame',
      desc: '',
      args: [],
    );
  }

  /// `Enter Brand ID`
  String get strEnterBrandID {
    return Intl.message(
      'Enter Brand ID',
      name: 'strEnterBrandID',
      desc: '',
      args: [],
    );
  }

  /// `Password`
  String get strPassword {
    return Intl.message(
      'Password',
      name: 'strPassword',
      desc: '',
      args: [],
    );
  }

  /// `Enter code`
  String get strEnterCode {
    return Intl.message(
      'Enter code',
      name: 'strEnterCode',
      desc: '',
      args: [],
    );
  }

  /// `Login`
  String get strLogin {
    return Intl.message(
      'Login',
      name: 'strLogin',
      desc: '',
      args: [],
    );
  }

  /// `Products not found`
  String get strProductNotFound {
    return Intl.message(
      'Products not found',
      name: 'strProductNotFound',
      desc: '',
      args: [],
    );
  }

  /// `Food categories not found!`
  String get strFoodsCategoriesNotFound {
    return Intl.message(
      'Food categories not found!',
      name: 'strFoodsCategoriesNotFound',
      desc: '',
      args: [],
    );
  }

  /// `No orders. Tap a dish to add`
  String get strSelectFoodsNotFound {
    return Intl.message(
      'No orders. Tap a dish to add',
      name: 'strSelectFoodsNotFound',
      desc: '',
      args: [],
    );
  }

  /// `Are you sure you want to clear extras?`
  String get strDoYouWantClearOrders {
    return Intl.message(
      'Are you sure you want to clear extras?',
      name: 'strDoYouWantClearOrders',
      desc: '',
      args: [],
    );
  }

  /// `Cancel`
  String get strCancel {
    return Intl.message(
      'Cancel',
      name: 'strCancel',
      desc: '',
      args: [],
    );
  }

  /// `Go back`
  String get strBackToScreen {
    return Intl.message(
      'Go back',
      name: 'strBackToScreen',
      desc: '',
      args: [],
    );
  }

  /// `Are you sure you want to leave? Foods will be cancelled.`
  String get strYouWantLeaveOrderScreen {
    return Intl.message(
      'Are you sure you want to leave? Foods will be cancelled.',
      name: 'strYouWantLeaveOrderScreen',
      desc: '',
      args: [],
    );
  }

  /// `Save`
  String get strSave {
    return Intl.message(
      'Save',
      name: 'strSave',
      desc: '',
      args: [],
    );
  }

  /// `Are you sure you want to send the order to the kitchen?`
  String get strDoYouWantSendOrdersToKitchken {
    return Intl.message(
      'Are you sure you want to send the order to the kitchen?',
      name: 'strDoYouWantSendOrdersToKitchken',
      desc: '',
      args: [],
    );
  }

  /// `Order successfully created`
  String get strOrderSuccessCreated {
    return Intl.message(
      'Order successfully created',
      name: 'strOrderSuccessCreated',
      desc: '',
      args: [],
    );
  }

  /// `Table`
  String get strTable {
    return Intl.message(
      'Table',
      name: 'strTable',
      desc: '',
      args: [],
    );
  }

  /// `Set number of guests`
  String get strSelectGuestsCount {
    return Intl.message(
      'Set number of guests',
      name: 'strSelectGuestsCount',
      desc: '',
      args: [],
    );
  }

  /// `Add`
  String get strAdd {
    return Intl.message(
      'Add',
      name: 'strAdd',
      desc: '',
      args: [],
    );
  }

  /// `All`
  String get all {
    return Intl.message(
      'All',
      name: 'all',
      desc: '',
      args: [],
    );
  }

  /// `Today`
  String get today {
    return Intl.message(
      'Today',
      name: 'today',
      desc: '',
      args: [],
    );
  }

  /// `Week`
  String get week {
    return Intl.message(
      'Week',
      name: 'week',
      desc: '',
      args: [],
    );
  }

  /// `Month`
  String get month {
    return Intl.message(
      'Month',
      name: 'month',
      desc: '',
      args: [],
    );
  }

  /// `Floor Map`
  String get strFloorMap {
    return Intl.message(
      'Floor Map',
      name: 'strFloorMap',
      desc: '',
      args: [],
    );
  }

  /// `Takeaway`
  String get strTakeaway {
    return Intl.message(
      'Takeaway',
      name: 'strTakeaway',
      desc: '',
      args: [],
    );
  }

  /// `Refresh`
  String get strRefresh {
    return Intl.message(
      'Refresh',
      name: 'strRefresh',
      desc: '',
      args: [],
    );
  }

  /// `Grid view`
  String get strGridView {
    return Intl.message(
      'Grid view',
      name: 'strGridView',
      desc: '',
      args: [],
    );
  }

  /// `Map view`
  String get strMapView {
    return Intl.message(
      'Map view',
      name: 'strMapView',
      desc: '',
      args: [],
    );
  }

  /// `Grid`
  String get strGrid {
    return Intl.message(
      'Grid',
      name: 'strGrid',
      desc: '',
      args: [],
    );
  }

  /// `Map`
  String get strMap {
    return Intl.message(
      'Map',
      name: 'strMap',
      desc: '',
      args: [],
    );
  }

  /// `No tables`
  String get strNoTables {
    return Intl.message(
      'No tables',
      name: 'strNoTables',
      desc: '',
      args: [],
    );
  }

  /// `Busy`
  String get strBusy {
    return Intl.message(
      'Busy',
      name: 'strBusy',
      desc: '',
      args: [],
    );
  }

  /// `Reserved`
  String get strReserved {
    return Intl.message(
      'Reserved',
      name: 'strReserved',
      desc: '',
      args: [],
    );
  }

  /// `Free`
  String get strFree {
    return Intl.message(
      'Free',
      name: 'strFree',
      desc: '',
      args: [],
    );
  }

  /// `Saved`
  String get strSavedBadge {
    return Intl.message(
      'Saved',
      name: 'strSavedBadge',
      desc: '',
      args: [],
    );
  }

  /// `guests`
  String get strGuestsSuffix {
    return Intl.message(
      'guests',
      name: 'strGuestsSuffix',
      desc: '',
      args: [],
    );
  }

  /// `people`
  String get strPersonsSuffix {
    return Intl.message(
      'people',
      name: 'strPersonsSuffix',
      desc: '',
      args: [],
    );
  }

  /// `Search...`
  String get strSearchHint {
    return Intl.message(
      'Search...',
      name: 'strSearchHint',
      desc: '',
      args: [],
    );
  }

  /// `Clear`
  String get strClear {
    return Intl.message(
      'Clear',
      name: 'strClear',
      desc: '',
      args: [],
    );
  }

  /// `Orders`
  String get strOrders {
    return Intl.message(
      'Orders',
      name: 'strOrders',
      desc: '',
      args: [],
    );
  }

  /// `Existing orders`
  String get strExistingOrders {
    return Intl.message(
      'Existing orders',
      name: 'strExistingOrders',
      desc: '',
      args: [],
    );
  }

  /// `Extras`
  String get strExtras {
    return Intl.message(
      'Extras',
      name: 'strExtras',
      desc: '',
      args: [],
    );
  }

  /// `Total:`
  String get strTotalLabel {
    return Intl.message(
      'Total:',
      name: 'strTotalLabel',
      desc: '',
      args: [],
    );
  }

  /// `Payment:`
  String get strPaymentLabel {
    return Intl.message(
      'Payment:',
      name: 'strPaymentLabel',
      desc: '',
      args: [],
    );
  }

  /// `Payment`
  String get strPayment {
    return Intl.message(
      'Payment',
      name: 'strPayment',
      desc: '',
      args: [],
    );
  }

  /// `Add`
  String get strAddItems {
    return Intl.message(
      'Add',
      name: 'strAddItems',
      desc: '',
      args: [],
    );
  }

  /// `Orders`
  String get strArchive {
    return Intl.message(
      'Orders',
      name: 'strArchive',
      desc: '',
      args: [],
    );
  }

  /// `Open bills`
  String get strOpenBills {
    return Intl.message(
      'Open bills',
      name: 'strOpenBills',
      desc: '',
      args: [],
    );
  }

  /// `Currently active`
  String get strNowActive {
    return Intl.message(
      'Currently active',
      name: 'strNowActive',
      desc: '',
      args: [],
    );
  }

  /// `Today's revenue`
  String get strTodayRevenue {
    return Intl.message(
      'Today\'s revenue',
      name: 'strTodayRevenue',
      desc: '',
      args: [],
    );
  }

  /// `sum`
  String get strSom {
    return Intl.message(
      'sum',
      name: 'strSom',
      desc: '',
      args: [],
    );
  }

  /// `Closed today`
  String get strClosedToday {
    return Intl.message(
      'Closed today',
      name: 'strClosedToday',
      desc: '',
      args: [],
    );
  }

  /// `bill`
  String get strBillSuffix {
    return Intl.message(
      'bill',
      name: 'strBillSuffix',
      desc: '',
      args: [],
    );
  }

  /// `Average check`
  String get strAverageCheck {
    return Intl.message(
      'Average check',
      name: 'strAverageCheck',
      desc: '',
      args: [],
    );
  }

  /// `Status`
  String get strStatusColumn {
    return Intl.message(
      'Status',
      name: 'strStatusColumn',
      desc: '',
      args: [],
    );
  }

  /// `Foods`
  String get strFoodsColumn {
    return Intl.message(
      'Foods',
      name: 'strFoodsColumn',
      desc: '',
      args: [],
    );
  }

  /// `Amount`
  String get strAmountColumn {
    return Intl.message(
      'Amount',
      name: 'strAmountColumn',
      desc: '',
      args: [],
    );
  }

  /// `Time`
  String get strTimeColumn {
    return Intl.message(
      'Time',
      name: 'strTimeColumn',
      desc: '',
      args: [],
    );
  }

  /// `Actions`
  String get strActionsColumn {
    return Intl.message(
      'Actions',
      name: 'strActionsColumn',
      desc: '',
      args: [],
    );
  }

  /// `Orders not found`
  String get strArchiveEmpty {
    return Intl.message(
      'Orders not found',
      name: 'strArchiveEmpty',
      desc: '',
      args: [],
    );
  }

  /// `Date`
  String get strDate {
    return Intl.message(
      'Date',
      name: 'strDate',
      desc: '',
      args: [],
    );
  }

  /// `All Orders`
  String get strAllOrdersTitle {
    return Intl.message(
      'All Orders',
      name: 'strAllOrdersTitle',
      desc: '',
      args: [],
    );
  }

  /// `Order type`
  String get strOrderType {
    return Intl.message(
      'Order type',
      name: 'strOrderType',
      desc: '',
      args: [],
    );
  }

  /// `Orders not found`
  String get strOrdersEmpty {
    return Intl.message(
      'Orders not found',
      name: 'strOrdersEmpty',
      desc: '',
      args: [],
    );
  }

  /// `Waiter`
  String get strWaiterRole {
    return Intl.message(
      'Waiter',
      name: 'strWaiterRole',
      desc: '',
      args: [],
    );
  }

  /// `Cashier`
  String get strCashierRole {
    return Intl.message(
      'Cashier',
      name: 'strCashierRole',
      desc: '',
      args: [],
    );
  }

  /// `Hall`
  String get strHall {
    return Intl.message(
      'Hall',
      name: 'strHall',
      desc: '',
      args: [],
    );
  }

  /// `Table`
  String get strTableNumber {
    return Intl.message(
      'Table',
      name: 'strTableNumber',
      desc: '',
      args: [],
    );
  }

  /// `Settings`
  String get strSettings {
    return Intl.message(
      'Settings',
      name: 'strSettings',
      desc: '',
      args: [],
    );
  }

  /// `Restaurant staff`
  String get strRestaurantStaff {
    return Intl.message(
      'Restaurant staff',
      name: 'strRestaurantStaff',
      desc: '',
      args: [],
    );
  }

  /// `Staff and roles`
  String get strStaffRoles {
    return Intl.message(
      'Staff and roles',
      name: 'strStaffRoles',
      desc: '',
      args: [],
    );
  }

  /// `Halls`
  String get strHalls {
    return Intl.message(
      'Halls',
      name: 'strHalls',
      desc: '',
      args: [],
    );
  }

  /// `Halls and tables`
  String get strHallsAndTables {
    return Intl.message(
      'Halls and tables',
      name: 'strHallsAndTables',
      desc: '',
      args: [],
    );
  }

  /// `Language and general`
  String get strLanguageAndGeneral {
    return Intl.message(
      'Language and general',
      name: 'strLanguageAndGeneral',
      desc: '',
      args: [],
    );
  }

  /// `Printer settings`
  String get strPrinterSettings {
    return Intl.message(
      'Printer settings',
      name: 'strPrinterSettings',
      desc: '',
      args: [],
    );
  }

  /// `ESC/POS devices`
  String get strEscPosDevices {
    return Intl.message(
      'ESC/POS devices',
      name: 'strEscPosDevices',
      desc: '',
      args: [],
    );
  }

  /// `LAN Network`
  String get strLanNetwork {
    return Intl.message(
      'LAN Network',
      name: 'strLanNetwork',
      desc: '',
      args: [],
    );
  }

  /// `Hub and client settings`
  String get strHubClientSettings {
    return Intl.message(
      'Hub and client settings',
      name: 'strHubClientSettings',
      desc: '',
      args: [],
    );
  }

  /// `Access restricted`
  String get strAccessRestricted {
    return Intl.message(
      'Access restricted',
      name: 'strAccessRestricted',
      desc: '',
      args: [],
    );
  }

  /// `Only administrator or manager can access settings.`
  String get strSettingsAdminOnly {
    return Intl.message(
      'Only administrator or manager can access settings.',
      name: 'strSettingsAdminOnly',
      desc: '',
      args: [],
    );
  }

  /// `Language, interface and menu view`
  String get strInterfaceSettings {
    return Intl.message(
      'Language, interface and menu view',
      name: 'strInterfaceSettings',
      desc: '',
      args: [],
    );
  }

  /// `Interface language`
  String get strInterfaceLanguage {
    return Intl.message(
      'Interface language',
      name: 'strInterfaceLanguage',
      desc: '',
      args: [],
    );
  }

  /// `Applied to all users`
  String get strAppliesToAllUsers {
    return Intl.message(
      'Applied to all users',
      name: 'strAppliesToAllUsers',
      desc: '',
      args: [],
    );
  }

  /// `Menu images`
  String get strMenuImages {
    return Intl.message(
      'Menu images',
      name: 'strMenuImages',
      desc: '',
      args: [],
    );
  }

  /// `Show images in product cards`
  String get strShowProductImages {
    return Intl.message(
      'Show images in product cards',
      name: 'strShowProductImages',
      desc: '',
      args: [],
    );
  }

  /// `Service charge`
  String get strServiceCharge {
    return Intl.message(
      'Service charge',
      name: 'strServiceCharge',
      desc: '',
      args: [],
    );
  }

  /// `Percent added to the order automatically`
  String get strServiceChargeHint {
    return Intl.message(
      'Percent added to the order automatically',
      name: 'strServiceChargeHint',
      desc: '',
      args: [],
    );
  }

  /// `Service charge saved`
  String get strServiceChargeSaved {
    return Intl.message(
      'Service charge saved',
      name: 'strServiceChargeSaved',
      desc: '',
      args: [],
    );
  }

  /// `Enter a value between 0 and 100`
  String get strServiceChargeInvalid {
    return Intl.message(
      'Enter a value between 0 and 100',
      name: 'strServiceChargeInvalid',
      desc: '',
      args: [],
    );
  }

  /// `O'zbek`
  String get strUzbek {
    return Intl.message(
      'O\'zbek',
      name: 'strUzbek',
      desc: '',
      args: [],
    );
  }

  /// `Русский`
  String get strRussian {
    return Intl.message(
      'Русский',
      name: 'strRussian',
      desc: '',
      args: [],
    );
  }

  /// `Open shift`
  String get strOpenShift {
    return Intl.message(
      'Open shift',
      name: 'strOpenShift',
      desc: '',
      args: [],
    );
  }

  /// `Press the button below to start work.`
  String get strStartWorkInstruction {
    return Intl.message(
      'Press the button below to start work.',
      name: 'strStartWorkInstruction',
      desc: '',
      args: [],
    );
  }

  /// `Close shift`
  String get strCloseShift {
    return Intl.message(
      'Close shift',
      name: 'strCloseShift',
      desc: '',
      args: [],
    );
  }

  /// `Press the button in the bottom right to close the shift.`
  String get strCloseShiftInstruction {
    return Intl.message(
      'Press the button in the bottom right to close the shift.',
      name: 'strCloseShiftInstruction',
      desc: '',
      args: [],
    );
  }

  /// `Shift opened`
  String get strShiftOpened {
    return Intl.message(
      'Shift opened',
      name: 'strShiftOpened',
      desc: '',
      args: [],
    );
  }

  /// `Terminal`
  String get strTerminal {
    return Intl.message(
      'Terminal',
      name: 'strTerminal',
      desc: '',
      args: [],
    );
  }

  /// `Connected`
  String get strConnected {
    return Intl.message(
      'Connected',
      name: 'strConnected',
      desc: '',
      args: [],
    );
  }

  /// `Duration`
  String get strDuration {
    return Intl.message(
      'Duration',
      name: 'strDuration',
      desc: '',
      args: [],
    );
  }

  /// `January`
  String get strJanuary {
    return Intl.message(
      'January',
      name: 'strJanuary',
      desc: '',
      args: [],
    );
  }

  /// `February`
  String get strFebruary {
    return Intl.message(
      'February',
      name: 'strFebruary',
      desc: '',
      args: [],
    );
  }

  /// `March`
  String get strMarch {
    return Intl.message(
      'March',
      name: 'strMarch',
      desc: '',
      args: [],
    );
  }

  /// `April`
  String get strApril {
    return Intl.message(
      'April',
      name: 'strApril',
      desc: '',
      args: [],
    );
  }

  /// `May`
  String get strMay {
    return Intl.message(
      'May',
      name: 'strMay',
      desc: '',
      args: [],
    );
  }

  /// `June`
  String get strJune {
    return Intl.message(
      'June',
      name: 'strJune',
      desc: '',
      args: [],
    );
  }

  /// `July`
  String get strJuly {
    return Intl.message(
      'July',
      name: 'strJuly',
      desc: '',
      args: [],
    );
  }

  /// `August`
  String get strAugust {
    return Intl.message(
      'August',
      name: 'strAugust',
      desc: '',
      args: [],
    );
  }

  /// `September`
  String get strSeptember {
    return Intl.message(
      'September',
      name: 'strSeptember',
      desc: '',
      args: [],
    );
  }

  /// `October`
  String get strOctober {
    return Intl.message(
      'October',
      name: 'strOctober',
      desc: '',
      args: [],
    );
  }

  /// `November`
  String get strNovember {
    return Intl.message(
      'November',
      name: 'strNovember',
      desc: '',
      args: [],
    );
  }

  /// `December`
  String get strDecember {
    return Intl.message(
      'December',
      name: 'strDecember',
      desc: '',
      args: [],
    );
  }

  /// `Monday`
  String get strMonday {
    return Intl.message(
      'Monday',
      name: 'strMonday',
      desc: '',
      args: [],
    );
  }

  /// `Tuesday`
  String get strTuesday {
    return Intl.message(
      'Tuesday',
      name: 'strTuesday',
      desc: '',
      args: [],
    );
  }

  /// `Wednesday`
  String get strWednesday {
    return Intl.message(
      'Wednesday',
      name: 'strWednesday',
      desc: '',
      args: [],
    );
  }

  /// `Thursday`
  String get strThursday {
    return Intl.message(
      'Thursday',
      name: 'strThursday',
      desc: '',
      args: [],
    );
  }

  /// `Friday`
  String get strFriday {
    return Intl.message(
      'Friday',
      name: 'strFriday',
      desc: '',
      args: [],
    );
  }

  /// `Saturday`
  String get strSaturday {
    return Intl.message(
      'Saturday',
      name: 'strSaturday',
      desc: '',
      args: [],
    );
  }

  /// `Sunday`
  String get strSunday {
    return Intl.message(
      'Sunday',
      name: 'strSunday',
      desc: '',
      args: [],
    );
  }

  /// `Print`
  String get strPrint {
    return Intl.message(
      'Print',
      name: 'strPrint',
      desc: '',
      args: [],
    );
  }

  /// `Tables`
  String get strTables {
    return Intl.message(
      'Tables',
      name: 'strTables',
      desc: '',
      args: [],
    );
  }

  /// `Shift`
  String get strShift {
    return Intl.message(
      'Shift',
      name: 'strShift',
      desc: '',
      args: [],
    );
  }

  /// `Menu`
  String get strMenu {
    return Intl.message(
      'Menu',
      name: 'strMenu',
      desc: '',
      args: [],
    );
  }

  /// `Admin`
  String get strRoleAdmin {
    return Intl.message(
      'Admin',
      name: 'strRoleAdmin',
      desc: '',
      args: [],
    );
  }

  /// `Superadmin`
  String get strRoleSuperadmin {
    return Intl.message(
      'Superadmin',
      name: 'strRoleSuperadmin',
      desc: '',
      args: [],
    );
  }

  /// `Manager`
  String get strRoleManager {
    return Intl.message(
      'Manager',
      name: 'strRoleManager',
      desc: '',
      args: [],
    );
  }

  /// `Cashier`
  String get strRoleCashier {
    return Intl.message(
      'Cashier',
      name: 'strRoleCashier',
      desc: '',
      args: [],
    );
  }

  /// `Waiter`
  String get strRoleWaiter {
    return Intl.message(
      'Waiter',
      name: 'strRoleWaiter',
      desc: '',
      args: [],
    );
  }

  /// `Chef`
  String get strRoleChef {
    return Intl.message(
      'Chef',
      name: 'strRoleChef',
      desc: '',
      args: [],
    );
  }

  /// `User`
  String get strRoleUser {
    return Intl.message(
      'User',
      name: 'strRoleUser',
      desc: '',
      args: [],
    );
  }

  /// `Drag`
  String get strDragHint {
    return Intl.message(
      'Drag',
      name: 'strDragHint',
      desc: '',
      args: [],
    );
  }

  /// `Zoom in`
  String get strEnlarge {
    return Intl.message(
      'Zoom in',
      name: 'strEnlarge',
      desc: '',
      args: [],
    );
  }

  /// `Zoom out`
  String get strShrink {
    return Intl.message(
      'Zoom out',
      name: 'strShrink',
      desc: '',
      args: [],
    );
  }

  /// `Re-center`
  String get strRecenter {
    return Intl.message(
      'Re-center',
      name: 'strRecenter',
      desc: '',
      args: [],
    );
  }

  /// `{n} tables`
  String strNPeopleTable(Object n) {
    return Intl.message(
      '$n tables',
      name: 'strNPeopleTable',
      desc: '',
      args: [n],
    );
  }

  /// `Are you sure you want to logout?`
  String get strLogoutConfirm {
    return Intl.message(
      'Are you sure you want to logout?',
      name: 'strLogoutConfirm',
      desc: '',
      args: [],
    );
  }

  /// `Enter PIN`
  String get strEnterPinCode {
    return Intl.message(
      'Enter PIN',
      name: 'strEnterPinCode',
      desc: '',
      args: [],
    );
  }

  /// `6-digit PIN`
  String get strSwitchTo6Digit {
    return Intl.message(
      '6-digit PIN',
      name: 'strSwitchTo6Digit',
      desc: '',
      args: [],
    );
  }

  /// `4-digit PIN`
  String get strSwitchTo4Digit {
    return Intl.message(
      '4-digit PIN',
      name: 'strSwitchTo4Digit',
      desc: '',
      args: [],
    );
  }

  /// `Offline mode — data will sync when connection returns`
  String get strOfflineModeMessage {
    return Intl.message(
      'Offline mode — data will sync when connection returns',
      name: 'strOfflineModeMessage',
      desc: '',
      args: [],
    );
  }

  /// `Add order`
  String get strAddOrder {
    return Intl.message(
      'Add order',
      name: 'strAddOrder',
      desc: '',
      args: [],
    );
  }

  /// `Notify kitchen`
  String get strNotifyKitchen {
    return Intl.message(
      'Notify kitchen',
      name: 'strNotifyKitchen',
      desc: '',
      args: [],
    );
  }

  /// `Needs attention`
  String get strNeedAttention {
    return Intl.message(
      'Needs attention',
      name: 'strNeedAttention',
      desc: '',
      args: [],
    );
  }

  /// `Go to payment`
  String get strGoToPayment {
    return Intl.message(
      'Go to payment',
      name: 'strGoToPayment',
      desc: '',
      args: [],
    );
  }

  /// `Enter notes...`
  String get strEnterNotes {
    return Intl.message(
      'Enter notes...',
      name: 'strEnterNotes',
      desc: '',
      args: [],
    );
  }

  /// `Other`
  String get strOther {
    return Intl.message(
      'Other',
      name: 'strOther',
      desc: '',
      args: [],
    );
  }

  /// `Extra spicy`
  String get strExtraSpicy {
    return Intl.message(
      'Extra spicy',
      name: 'strExtraSpicy',
      desc: '',
      args: [],
    );
  }

  /// `Extra salt`
  String get strExtraSalt {
    return Intl.message(
      'Extra salt',
      name: 'strExtraSalt',
      desc: '',
      args: [],
    );
  }

  /// `More ketchup`
  String get strMoreKetchup {
    return Intl.message(
      'More ketchup',
      name: 'strMoreKetchup',
      desc: '',
      args: [],
    );
  }

  /// `Hotter`
  String get strHotter {
    return Intl.message(
      'Hotter',
      name: 'strHotter',
      desc: '',
      args: [],
    );
  }

  /// `For notes`
  String get strForNotes {
    return Intl.message(
      'For notes',
      name: 'strForNotes',
      desc: '',
      args: [],
    );
  }

  /// `Confirm deletion`
  String get strConfirmDelete {
    return Intl.message(
      'Confirm deletion',
      name: 'strConfirmDelete',
      desc: '',
      args: [],
    );
  }

  /// `Delete '{item}'?`
  String strConfirmDeleteItem(Object item) {
    return Intl.message(
      'Delete \'$item\'?',
      name: 'strConfirmDeleteItem',
      desc: '',
      args: [item],
    );
  }

  /// `Payment info not found`
  String get strPaymentInfoNotFound {
    return Intl.message(
      'Payment info not found',
      name: 'strPaymentInfoNotFound',
      desc: '',
      args: [],
    );
  }

  /// `Confirm that customer paid by card`
  String get strConfirmCardPayment {
    return Intl.message(
      'Confirm that customer paid by card',
      name: 'strConfirmCardPayment',
      desc: '',
      args: [],
    );
  }

  /// `Cash`
  String get strCash {
    return Intl.message(
      'Cash',
      name: 'strCash',
      desc: '',
      args: [],
    );
  }

  /// `Card`
  String get strCard {
    return Intl.message(
      'Card',
      name: 'strCard',
      desc: '',
      args: [],
    );
  }

  /// `Exact amount`
  String get strExactAmount {
    return Intl.message(
      'Exact amount',
      name: 'strExactAmount',
      desc: '',
      args: [],
    );
  }

  /// `View receipt`
  String get strViewReceipt {
    return Intl.message(
      'View receipt',
      name: 'strViewReceipt',
      desc: '',
      args: [],
    );
  }

  /// `Guest`
  String get strGuest {
    return Intl.message(
      'Guest',
      name: 'strGuest',
      desc: '',
      args: [],
    );
  }

  /// `Search by check number`
  String get strSearchByCheckNumber {
    return Intl.message(
      'Search by check number',
      name: 'strSearchByCheckNumber',
      desc: '',
      args: [],
    );
  }

  /// `Email`
  String get strEmail {
    return Intl.message(
      'Email',
      name: 'strEmail',
      desc: '',
      args: [],
    );
  }

  /// `Close`
  String get strCloseAction {
    return Intl.message(
      'Close',
      name: 'strCloseAction',
      desc: '',
      args: [],
    );
  }

  /// `Customer`
  String get strCustomer {
    return Intl.message(
      'Customer',
      name: 'strCustomer',
      desc: '',
      args: [],
    );
  }

  /// `Search...`
  String get strSearch {
    return Intl.message(
      'Search...',
      name: 'strSearch',
      desc: '',
      args: [],
    );
  }

  /// `Table, check number...`
  String get strSearchTableOrCheck {
    return Intl.message(
      'Table, check number...',
      name: 'strSearchTableOrCheck',
      desc: '',
      args: [],
    );
  }

  /// `# Order`
  String get strOrderNumber {
    return Intl.message(
      '# Order',
      name: 'strOrderNumber',
      desc: '',
      args: [],
    );
  }

  /// `Time`
  String get strTimeColumnHeader {
    return Intl.message(
      'Time',
      name: 'strTimeColumnHeader',
      desc: '',
      args: [],
    );
  }

  /// `Type`
  String get strTypeColumnHeader {
    return Intl.message(
      'Type',
      name: 'strTypeColumnHeader',
      desc: '',
      args: [],
    );
  }

  /// `Table / Hall`
  String get strTableHall {
    return Intl.message(
      'Table / Hall',
      name: 'strTableHall',
      desc: '',
      args: [],
    );
  }

  /// `Dishes`
  String get strDishesColumn {
    return Intl.message(
      'Dishes',
      name: 'strDishesColumn',
      desc: '',
      args: [],
    );
  }

  /// `Amount`
  String get strAmountColumnHeader {
    return Intl.message(
      'Amount',
      name: 'strAmountColumnHeader',
      desc: '',
      args: [],
    );
  }

  /// `Status`
  String get strStatusColumnHeader {
    return Intl.message(
      'Status',
      name: 'strStatusColumnHeader',
      desc: '',
      args: [],
    );
  }

  /// `Action`
  String get strActionColumnHeader {
    return Intl.message(
      'Action',
      name: 'strActionColumnHeader',
      desc: '',
      args: [],
    );
  }

  /// `#`
  String get strNumberColumn {
    return Intl.message(
      '#',
      name: 'strNumberColumn',
      desc: '',
      args: [],
    );
  }

  /// `Total`
  String get strTotalSum {
    return Intl.message(
      'Total',
      name: 'strTotalSum',
      desc: '',
      args: [],
    );
  }

  /// `{size} / page`
  String strPageSize(Object size) {
    return Intl.message(
      '$size / page',
      name: 'strPageSize',
      desc: '',
      args: [size],
    );
  }

  /// `Tap on a check to see details!`
  String get strCheckForDetails {
    return Intl.message(
      'Tap on a check to see details!',
      name: 'strCheckForDetails',
      desc: '',
      args: [],
    );
  }

  /// `Check not found`
  String get strCheckNotFound {
    return Intl.message(
      'Check not found',
      name: 'strCheckNotFound',
      desc: '',
      args: [],
    );
  }

  /// `Order details`
  String get strOrderDetails {
    return Intl.message(
      'Order details',
      name: 'strOrderDetails',
      desc: '',
      args: [],
    );
  }

  /// `Check number:`
  String get strCheckNumberLabel {
    return Intl.message(
      'Check number:',
      name: 'strCheckNumberLabel',
      desc: '',
      args: [],
    );
  }

  /// `Table:`
  String get strTableLabel {
    return Intl.message(
      'Table:',
      name: 'strTableLabel',
      desc: '',
      args: [],
    );
  }

  /// `Date:`
  String get strDateLabel {
    return Intl.message(
      'Date:',
      name: 'strDateLabel',
      desc: '',
      args: [],
    );
  }

  /// `Cashier:`
  String get strCashierLabel {
    return Intl.message(
      'Cashier:',
      name: 'strCashierLabel',
      desc: '',
      args: [],
    );
  }

  /// `Payment method:`
  String get strPaymentMethodLabel {
    return Intl.message(
      'Payment method:',
      name: 'strPaymentMethodLabel',
      desc: '',
      args: [],
    );
  }

  /// `Given`
  String get strGiven {
    return Intl.message(
      'Given',
      name: 'strGiven',
      desc: '',
      args: [],
    );
  }

  /// `Change`
  String get strChange {
    return Intl.message(
      'Change',
      name: 'strChange',
      desc: '',
      args: [],
    );
  }

  /// `Total:`
  String get strTotalColon {
    return Intl.message(
      'Total:',
      name: 'strTotalColon',
      desc: '',
      args: [],
    );
  }

  /// `All:`
  String get strAllColon {
    return Intl.message(
      'All:',
      name: 'strAllColon',
      desc: '',
      args: [],
    );
  }

  /// `Total amount`
  String get strUmumiySumma {
    return Intl.message(
      'Total amount',
      name: 'strUmumiySumma',
      desc: '',
      args: [],
    );
  }

  /// `Export`
  String get strExport {
    return Intl.message(
      'Export',
      name: 'strExport',
      desc: '',
      args: [],
    );
  }

  /// `Total sales`
  String get strTotalSales {
    return Intl.message(
      'Total sales',
      name: 'strTotalSales',
      desc: '',
      args: [],
    );
  }

  /// `Opening balance`
  String get strOpeningBalance {
    return Intl.message(
      'Opening balance',
      name: 'strOpeningBalance',
      desc: '',
      args: [],
    );
  }

  /// `Shift revenue`
  String get strShiftRevenue {
    return Intl.message(
      'Shift revenue',
      name: 'strShiftRevenue',
      desc: '',
      args: [],
    );
  }

  /// `Discounts`
  String get strDiscounts {
    return Intl.message(
      'Discounts',
      name: 'strDiscounts',
      desc: '',
      args: [],
    );
  }

  /// `Load error`
  String get strLoadError {
    return Intl.message(
      'Load error',
      name: 'strLoadError',
      desc: '',
      args: [],
    );
  }

  /// `Delete employee`
  String get strDeleteEmployee {
    return Intl.message(
      'Delete employee',
      name: 'strDeleteEmployee',
      desc: '',
      args: [],
    );
  }

  /// `Account {name} will be deleted. This action cannot be undone.`
  String strDeleteEmployeeConfirm(Object name) {
    return Intl.message(
      'Account $name will be deleted. This action cannot be undone.',
      name: 'strDeleteEmployeeConfirm',
      desc: '',
      args: [name],
    );
  }

  /// `Cancel`
  String get strCancelShort {
    return Intl.message(
      'Cancel',
      name: 'strCancelShort',
      desc: '',
      args: [],
    );
  }

  /// `Delete`
  String get strDelete {
    return Intl.message(
      'Delete',
      name: 'strDelete',
      desc: '',
      args: [],
    );
  }

  /// `Delete error`
  String get strDeleteError {
    return Intl.message(
      'Delete error',
      name: 'strDeleteError',
      desc: '',
      args: [],
    );
  }

  /// `Save error`
  String get strSaveError {
    return Intl.message(
      'Save error',
      name: 'strSaveError',
      desc: '',
      args: [],
    );
  }

  /// `Users, roles and permissions`
  String get strUsersRolesPerms {
    return Intl.message(
      'Users, roles and permissions',
      name: 'strUsersRolesPerms',
      desc: '',
      args: [],
    );
  }

  /// `New employee`
  String get strAddNewEmployee {
    return Intl.message(
      'New employee',
      name: 'strAddNewEmployee',
      desc: '',
      args: [],
    );
  }

  /// `Search by name or username`
  String get strSearchNameOrUsername {
    return Intl.message(
      'Search by name or username',
      name: 'strSearchNameOrUsername',
      desc: '',
      args: [],
    );
  }

  /// `Role`
  String get strRole {
    return Intl.message(
      'Role',
      name: 'strRole',
      desc: '',
      args: [],
    );
  }

  /// `No employees yet`
  String get strNoEmployeesYet {
    return Intl.message(
      'No employees yet',
      name: 'strNoEmployeesYet',
      desc: '',
      args: [],
    );
  }

  /// `Add first employee`
  String get strAddFirstEmployee {
    return Intl.message(
      'Add first employee',
      name: 'strAddFirstEmployee',
      desc: '',
      args: [],
    );
  }

  /// `Edit`
  String get strEdit {
    return Intl.message(
      'Edit',
      name: 'strEdit',
      desc: '',
      args: [],
    );
  }

  /// `Full name`
  String get strFullName {
    return Intl.message(
      'Full name',
      name: 'strFullName',
      desc: '',
      args: [],
    );
  }

  /// `Username`
  String get strUsername {
    return Intl.message(
      'Username',
      name: 'strUsername',
      desc: '',
      args: [],
    );
  }

  /// `Phone`
  String get strPhone {
    return Intl.message(
      'Phone',
      name: 'strPhone',
      desc: '',
      args: [],
    );
  }

  /// `PIN code (optional)`
  String get strPinOptional {
    return Intl.message(
      'PIN code (optional)',
      name: 'strPinOptional',
      desc: '',
      args: [],
    );
  }

  /// `Delete hall`
  String get strDeleteHall {
    return Intl.message(
      'Delete hall',
      name: 'strDeleteHall',
      desc: '',
      args: [],
    );
  }

  /// `New hall`
  String get strAddNewHall {
    return Intl.message(
      'New hall',
      name: 'strAddNewHall',
      desc: '',
      args: [],
    );
  }

  /// `No halls yet`
  String get strNoHallsYet {
    return Intl.message(
      'No halls yet',
      name: 'strNoHallsYet',
      desc: '',
      args: [],
    );
  }

  /// `Add first hall`
  String get strAddFirstHall {
    return Intl.message(
      'Add first hall',
      name: 'strAddFirstHall',
      desc: '',
      args: [],
    );
  }

  /// `Error saving position`
  String get strSavePositionError {
    return Intl.message(
      'Error saving position',
      name: 'strSavePositionError',
      desc: '',
      args: [],
    );
  }

  /// `Positions saved`
  String get strPositionsSaved {
    return Intl.message(
      'Positions saved',
      name: 'strPositionsSaved',
      desc: '',
      args: [],
    );
  }

  /// `{count} tables not saved`
  String strTablesNotSavedCount(Object count) {
    return Intl.message(
      '$count tables not saved',
      name: 'strTablesNotSavedCount',
      desc: '',
      args: [count],
    );
  }

  /// `Delete table`
  String get strDeleteTable {
    return Intl.message(
      'Delete table',
      name: 'strDeleteTable',
      desc: '',
      args: [],
    );
  }

  /// `No tables in this hall`
  String get strNoTablesInHall {
    return Intl.message(
      'No tables in this hall',
      name: 'strNoTablesInHall',
      desc: '',
      args: [],
    );
  }

  /// `Add first table`
  String get strAddFirstTable {
    return Intl.message(
      'Add first table',
      name: 'strAddFirstTable',
      desc: '',
      args: [],
    );
  }

  /// `New table`
  String get strNewTable {
    return Intl.message(
      'New table',
      name: 'strNewTable',
      desc: '',
      args: [],
    );
  }

  /// `Total tables`
  String get strTotalTables {
    return Intl.message(
      'Total tables',
      name: 'strTotalTables',
      desc: '',
      args: [],
    );
  }

  /// `Total capacity`
  String get strTotalCapacity {
    return Intl.message(
      'Total capacity',
      name: 'strTotalCapacity',
      desc: '',
      args: [],
    );
  }

  /// `Capacity (persons)`
  String get strCapacityPersons {
    return Intl.message(
      'Capacity (persons)',
      name: 'strCapacityPersons',
      desc: '',
      args: [],
    );
  }

  /// `Shape`
  String get strShape {
    return Intl.message(
      'Shape',
      name: 'strShape',
      desc: '',
      args: [],
    );
  }

  /// `Square`
  String get strSquare {
    return Intl.message(
      'Square',
      name: 'strSquare',
      desc: '',
      args: [],
    );
  }

  /// `Round`
  String get strRound {
    return Intl.message(
      'Round',
      name: 'strRound',
      desc: '',
      args: [],
    );
  }

  /// `Type`
  String get strTableType {
    return Intl.message(
      'Type',
      name: 'strTableType',
      desc: '',
      args: [],
    );
  }

  /// `Regular`
  String get strRegular {
    return Intl.message(
      'Regular',
      name: 'strRegular',
      desc: '',
      args: [],
    );
  }

  /// `Hourly`
  String get strHourly {
    return Intl.message(
      'Hourly',
      name: 'strHourly',
      desc: '',
      args: [],
    );
  }

  /// `Hourly price (som)`
  String get strHourlyPrice {
    return Intl.message(
      'Hourly price (som)',
      name: 'strHourlyPrice',
      desc: '',
      args: [],
    );
  }

  /// `Width (m)`
  String get strWidthMeters {
    return Intl.message(
      'Width (m)',
      name: 'strWidthMeters',
      desc: '',
      args: [],
    );
  }

  /// `Height (m)`
  String get strHeightMeters {
    return Intl.message(
      'Height (m)',
      name: 'strHeightMeters',
      desc: '',
      args: [],
    );
  }

  /// `Angle (°)`
  String get strAngleDegrees {
    return Intl.message(
      'Angle (°)',
      name: 'strAngleDegrees',
      desc: '',
      args: [],
    );
  }

  /// `Initial status`
  String get strInitialStatus {
    return Intl.message(
      'Initial status',
      name: 'strInitialStatus',
      desc: '',
      args: [],
    );
  }

  /// `Closed`
  String get strClosedStatus {
    return Intl.message(
      'Closed',
      name: 'strClosedStatus',
      desc: '',
      args: [],
    );
  }

  /// `Location map`
  String get strLocationMap {
    return Intl.message(
      'Location map',
      name: 'strLocationMap',
      desc: '',
      args: [],
    );
  }

  /// `Position X (m)`
  String get strPositionX {
    return Intl.message(
      'Position X (m)',
      name: 'strPositionX',
      desc: '',
      args: [],
    );
  }

  /// `Position Y (m)`
  String get strPositionY {
    return Intl.message(
      'Position Y (m)',
      name: 'strPositionY',
      desc: '',
      args: [],
    );
  }

  /// `Hall name`
  String get strHallName {
    return Intl.message(
      'Hall name',
      name: 'strHallName',
      desc: '',
      args: [],
    );
  }

  /// `Width (m)`
  String get strWidthShort {
    return Intl.message(
      'Width (m)',
      name: 'strWidthShort',
      desc: '',
      args: [],
    );
  }

  /// `Height (m)`
  String get strHeightShort {
    return Intl.message(
      'Height (m)',
      name: 'strHeightShort',
      desc: '',
      args: [],
    );
  }

  /// `Delete printer`
  String get strDeletePrinter {
    return Intl.message(
      'Delete printer',
      name: 'strDeletePrinter',
      desc: '',
      args: [],
    );
  }

  /// `New printer`
  String get strAddPrinter {
    return Intl.message(
      'New printer',
      name: 'strAddPrinter',
      desc: '',
      args: [],
    );
  }

  /// `No printers yet`
  String get strNoPrintersYet {
    return Intl.message(
      'No printers yet',
      name: 'strNoPrintersYet',
      desc: '',
      args: [],
    );
  }

  /// `Add first printer`
  String get strAddFirstPrinter {
    return Intl.message(
      'Add first printer',
      name: 'strAddFirstPrinter',
      desc: '',
      args: [],
    );
  }

  /// `Check printer`
  String get strCheckPrinter {
    return Intl.message(
      'Check printer',
      name: 'strCheckPrinter',
      desc: '',
      args: [],
    );
  }

  /// `Category`
  String get strCategory {
    return Intl.message(
      'Category',
      name: 'strCategory',
      desc: '',
      args: [],
    );
  }

  /// `New printer`
  String get strNewPrinter {
    return Intl.message(
      'New printer',
      name: 'strNewPrinter',
      desc: '',
      args: [],
    );
  }

  /// `Edit printer`
  String get strEditPrinter {
    return Intl.message(
      'Edit printer',
      name: 'strEditPrinter',
      desc: '',
      args: [],
    );
  }

  /// `IP address`
  String get strIPAddress {
    return Intl.message(
      'IP address',
      name: 'strIPAddress',
      desc: '',
      args: [],
    );
  }

  /// `Port`
  String get strPort {
    return Intl.message(
      'Port',
      name: 'strPort',
      desc: '',
      args: [],
    );
  }

  /// `Printer type`
  String get strPrinterType {
    return Intl.message(
      'Printer type',
      name: 'strPrinterType',
      desc: '',
      args: [],
    );
  }

  /// `Connection type`
  String get strConnectionType {
    return Intl.message(
      'Connection type',
      name: 'strConnectionType',
      desc: '',
      args: [],
    );
  }

  /// `Cable`
  String get strCable {
    return Intl.message(
      'Cable',
      name: 'strCable',
      desc: '',
      args: [],
    );
  }

  /// `Wi-Fi`
  String get strWiFi {
    return Intl.message(
      'Wi-Fi',
      name: 'strWiFi',
      desc: '',
      args: [],
    );
  }

  /// `Connected categories`
  String get strConnectedCategories {
    return Intl.message(
      'Connected categories',
      name: 'strConnectedCategories',
      desc: '',
      args: [],
    );
  }

  /// `Network (LAN)`
  String get strNetworkLAN {
    return Intl.message(
      'Network (LAN)',
      name: 'strNetworkLAN',
      desc: '',
      args: [],
    );
  }

  /// `Device synchronization`
  String get strDeviceSynchronization {
    return Intl.message(
      'Device synchronization',
      name: 'strDeviceSynchronization',
      desc: '',
      args: [],
    );
  }

  /// `Mode`
  String get strMode {
    return Intl.message(
      'Mode',
      name: 'strMode',
      desc: '',
      args: [],
    );
  }

  /// `This device's role in the LAN network`
  String get strModeDescription {
    return Intl.message(
      'This device\'s role in the LAN network',
      name: 'strModeDescription',
      desc: '',
      args: [],
    );
  }

  /// `Disabled`
  String get strDisabled {
    return Intl.message(
      'Disabled',
      name: 'strDisabled',
      desc: '',
      args: [],
    );
  }

  /// `Hub`
  String get strHub {
    return Intl.message(
      'Hub',
      name: 'strHub',
      desc: '',
      args: [],
    );
  }

  /// `Client`
  String get strClient {
    return Intl.message(
      'Client',
      name: 'strClient',
      desc: '',
      args: [],
    );
  }

  /// `Receipt info`
  String get strReceiptInfo {
    return Intl.message(
      'Receipt info',
      name: 'strReceiptInfo',
      desc: '',
      args: [],
    );
  }

  /// `Organization name`
  String get strOrgName {
    return Intl.message(
      'Organization name',
      name: 'strOrgName',
      desc: '',
      args: [],
    );
  }

  /// `Address`
  String get strAddress {
    return Intl.message(
      'Address',
      name: 'strAddress',
      desc: '',
      args: [],
    );
  }

  /// `Delete category`
  String get strDeleteCategory {
    return Intl.message(
      'Delete category',
      name: 'strDeleteCategory',
      desc: '',
      args: [],
    );
  }

  /// `Delete meal`
  String get strDeleteMeal {
    return Intl.message(
      'Delete meal',
      name: 'strDeleteMeal',
      desc: '',
      args: [],
    );
  }

  /// `Add category`
  String get strAddCategory {
    return Intl.message(
      'Add category',
      name: 'strAddCategory',
      desc: '',
      args: [],
    );
  }

  /// `All dishes`
  String get strAllDishes {
    return Intl.message(
      'All dishes',
      name: 'strAllDishes',
      desc: '',
      args: [],
    );
  }

  /// `New meal`
  String get strNewMeal {
    return Intl.message(
      'New meal',
      name: 'strNewMeal',
      desc: '',
      args: [],
    );
  }

  /// `Edit meal`
  String get strEditMeal {
    return Intl.message(
      'Edit meal',
      name: 'strEditMeal',
      desc: '',
      args: [],
    );
  }

  /// `Quantity`
  String get strQuantity {
    return Intl.message(
      'Quantity',
      name: 'strQuantity',
      desc: '',
      args: [],
    );
  }

  /// `Ingredients`
  String get strIngredients {
    return Intl.message(
      'Ingredients',
      name: 'strIngredients',
      desc: '',
      args: [],
    );
  }

  /// `Semi-finished`
  String get strSemiFinished {
    return Intl.message(
      'Semi-finished',
      name: 'strSemiFinished',
      desc: '',
      args: [],
    );
  }

  /// `Compounds`
  String get strCompounds {
    return Intl.message(
      'Compounds',
      name: 'strCompounds',
      desc: '',
      args: [],
    );
  }

  /// `{count} Ingredients`
  String strIngredientsCount(Object count) {
    return Intl.message(
      '$count Ingredients',
      name: 'strIngredientsCount',
      desc: '',
      args: [count],
    );
  }

  /// `{count} Compounds`
  String strCompoundsCount(Object count) {
    return Intl.message(
      '$count Compounds',
      name: 'strCompoundsCount',
      desc: '',
      args: [count],
    );
  }

  /// `Name, category and price are required`
  String get strRequiredFields {
    return Intl.message(
      'Name, category and price are required',
      name: 'strRequiredFields',
      desc: '',
      args: [],
    );
  }

  /// `File must not exceed 5 MB`
  String get strFileTooLarge {
    return Intl.message(
      'File must not exceed 5 MB',
      name: 'strFileTooLarge',
      desc: '',
      args: [],
    );
  }

  /// `Failed to upload image`
  String get strUploadFailed {
    return Intl.message(
      'Failed to upload image',
      name: 'strUploadFailed',
      desc: '',
      args: [],
    );
  }

  /// `Upload error`
  String get strUploadError {
    return Intl.message(
      'Upload error',
      name: 'strUploadError',
      desc: '',
      args: [],
    );
  }

  /// `Failed to load meal composition`
  String get strLoadCompositionError {
    return Intl.message(
      'Failed to load meal composition',
      name: 'strLoadCompositionError',
      desc: '',
      args: [],
    );
  }

  /// `Images`
  String get strImages {
    return Intl.message(
      'Images',
      name: 'strImages',
      desc: '',
      args: [],
    );
  }

  /// `Select file`
  String get strSelectFile {
    return Intl.message(
      'Select file',
      name: 'strSelectFile',
      desc: '',
      args: [],
    );
  }

  /// `Waiting`
  String get strWaiting {
    return Intl.message(
      'Waiting',
      name: 'strWaiting',
      desc: '',
      args: [],
    );
  }

  /// `Cooking`
  String get strCooking {
    return Intl.message(
      'Cooking',
      name: 'strCooking',
      desc: '',
      args: [],
    );
  }

  /// `Received`
  String get strReceived {
    return Intl.message(
      'Received',
      name: 'strReceived',
      desc: '',
      args: [],
    );
  }

  /// `Cancelled`
  String get strCancelled {
    return Intl.message(
      'Cancelled',
      name: 'strCancelled',
      desc: '',
      args: [],
    );
  }

  /// `Start`
  String get strStart {
    return Intl.message(
      'Start',
      name: 'strStart',
      desc: '',
      args: [],
    );
  }

  /// `Pause`
  String get strPauseAction {
    return Intl.message(
      'Pause',
      name: 'strPauseAction',
      desc: '',
      args: [],
    );
  }

  /// `Resume`
  String get strResumeAction {
    return Intl.message(
      'Resume',
      name: 'strResumeAction',
      desc: '',
      args: [],
    );
  }

  /// `Notifications`
  String get strNotifications {
    return Intl.message(
      'Notifications',
      name: 'strNotifications',
      desc: '',
      args: [],
    );
  }

  /// `Error`
  String get strError {
    return Intl.message(
      'Error',
      name: 'strError',
      desc: '',
      args: [],
    );
  }

  /// `All`
  String get strAllRoles {
    return Intl.message(
      'All',
      name: 'strAllRoles',
      desc: '',
      args: [],
    );
  }

  /// `OK`
  String get strOK {
    return Intl.message(
      'OK',
      name: 'strOK',
      desc: '',
      args: [],
    );
  }

  /// `+998 (__) ___ __ __`
  String get strPhoneMask {
    return Intl.message(
      '+998 (__) ___ __ __',
      name: 'strPhoneMask',
      desc: '',
      args: [],
    );
  }

  /// `All`
  String get strAllHalls {
    return Intl.message(
      'All',
      name: 'strAllHalls',
      desc: '',
      args: [],
    );
  }

  /// `Shift report`
  String get strShiftReport {
    return Intl.message(
      'Shift report',
      name: 'strShiftReport',
      desc: '',
      args: [],
    );
  }

  /// `Cashier`
  String get strCashier {
    return Intl.message(
      'Cashier',
      name: 'strCashier',
      desc: '',
      args: [],
    );
  }

  /// `Shift open`
  String get strShiftOpen {
    return Intl.message(
      'Shift open',
      name: 'strShiftOpen',
      desc: '',
      args: [],
    );
  }

  /// `Current shift`
  String get strCurrentShift {
    return Intl.message(
      'Current shift',
      name: 'strCurrentShift',
      desc: '',
      args: [],
    );
  }

  /// `Opened`
  String get strOpenedAt {
    return Intl.message(
      'Opened',
      name: 'strOpenedAt',
      desc: '',
      args: [],
    );
  }

  /// `Cash balance`
  String get strCashBalance {
    return Intl.message(
      'Cash balance',
      name: 'strCashBalance',
      desc: '',
      args: [],
    );
  }

  /// `Expected balance`
  String get strExpectedBalance {
    return Intl.message(
      'Expected balance',
      name: 'strExpectedBalance',
      desc: '',
      args: [],
    );
  }

  /// `Initial balance`
  String get strInitialBalance {
    return Intl.message(
      'Initial balance',
      name: 'strInitialBalance',
      desc: '',
      args: [],
    );
  }

  /// `Recent orders`
  String get strRecentOrders {
    return Intl.message(
      'Recent orders',
      name: 'strRecentOrders',
      desc: '',
      args: [],
    );
  }

  /// `View all`
  String get strViewAll {
    return Intl.message(
      'View all',
      name: 'strViewAll',
      desc: '',
      args: [],
    );
  }

  /// `Hourly sales dynamics`
  String get strHourlySalesDynamics {
    return Intl.message(
      'Hourly sales dynamics',
      name: 'strHourlySalesDynamics',
      desc: '',
      args: [],
    );
  }

  /// `Peak time`
  String get strPeakTime {
    return Intl.message(
      'Peak time',
      name: 'strPeakTime',
      desc: '',
      args: [],
    );
  }

  /// `No sales data yet`
  String get strNoSalesData {
    return Intl.message(
      'No sales data yet',
      name: 'strNoSalesData',
      desc: '',
      args: [],
    );
  }

  /// `Waiting for order`
  String get strWaitingForOrder {
    return Intl.message(
      'Waiting for order',
      name: 'strWaitingForOrder',
      desc: '',
      args: [],
    );
  }

  /// `Discount & Service`
  String get strDiscountServiceTitle {
    return Intl.message(
      'Discount & Service',
      name: 'strDiscountServiceTitle',
      desc: '',
      args: [],
    );
  }

  /// `No discount yet`
  String get strNoDiscountYet {
    return Intl.message(
      'No discount yet',
      name: 'strNoDiscountYet',
      desc: '',
      args: [],
    );
  }

  /// `Close shift`
  String get strCloseShiftShort {
    return Intl.message(
      'Close shift',
      name: 'strCloseShiftShort',
      desc: '',
      args: [],
    );
  }

  /// `Total revenue`
  String get strTotalRevenueLabel {
    return Intl.message(
      'Total revenue',
      name: 'strTotalRevenueLabel',
      desc: '',
      args: [],
    );
  }

  /// `Service`
  String get strService {
    return Intl.message(
      'Service',
      name: 'strService',
      desc: '',
      args: [],
    );
  }

  /// `Discount`
  String get strDiscount {
    return Intl.message(
      'Discount',
      name: 'strDiscount',
      desc: '',
      args: [],
    );
  }

  /// `No orders in this shift yet`
  String get strNoOrdersInShift {
    return Intl.message(
      'No orders in this shift yet',
      name: 'strNoOrdersInShift',
      desc: '',
      args: [],
    );
  }

  /// `now`
  String get strNowShort {
    return Intl.message(
      'now',
      name: 'strNowShort',
      desc: '',
      args: [],
    );
  }

  /// `Shift`
  String get strShiftHash {
    return Intl.message(
      'Shift',
      name: 'strShiftHash',
      desc: '',
      args: [],
    );
  }

  /// `avg`
  String get strAverageShort {
    return Intl.message(
      'avg',
      name: 'strAverageShort',
      desc: '',
      args: [],
    );
  }

  /// `{count} orders · avg {avg}`
  String strOrdersCountWithAvg(Object count, Object avg) {
    return Intl.message(
      '$count orders · avg $avg',
      name: 'strOrdersCountWithAvg',
      desc: '',
      args: [count, avg],
    );
  }

  /// `{count} orders`
  String strOrdersCountShort(Object count) {
    return Intl.message(
      '$count orders',
      name: 'strOrdersCountShort',
      desc: '',
      args: [count],
    );
  }

  /// `{count} items · avg {avg}`
  String strItemsCountWithAvg(Object count, Object avg) {
    return Intl.message(
      '$count items · avg $avg',
      name: 'strItemsCountWithAvg',
      desc: '',
      args: [count, avg],
    );
  }

  /// `{count} items · {time}`
  String strItemsCountWithTime(Object count, Object time) {
    return Intl.message(
      '$count items · $time',
      name: 'strItemsCountWithTime',
      desc: '',
      args: [count, time],
    );
  }

  /// `Duration`
  String get strDurationLabel {
    return Intl.message(
      'Duration',
      name: 'strDurationLabel',
      desc: '',
      args: [],
    );
  }

  /// `Not ordered`
  String get strNotOrdered {
    return Intl.message(
      'Not ordered',
      name: 'strNotOrdered',
      desc: '',
      args: [],
    );
  }

  /// `Shift just started`
  String get strShiftJustStarted {
    return Intl.message(
      'Shift just started',
      name: 'strShiftJustStarted',
      desc: '',
      args: [],
    );
  }

  /// `Not yet`
  String get strNotYet {
    return Intl.message(
      'Not yet',
      name: 'strNotYet',
      desc: '',
      args: [],
    );
  }

  /// `No service charge yet`
  String get strNoServiceChargeYet {
    return Intl.message(
      'No service charge yet',
      name: 'strNoServiceChargeYet',
      desc: '',
      args: [],
    );
  }

  /// `Waiting for order`
  String get strWaitingForOrderStatus {
    return Intl.message(
      'Waiting for order',
      name: 'strWaitingForOrderStatus',
      desc: '',
      args: [],
    );
  }

  /// `Open shift first. Shift must be open to create orders.`
  String get strShiftNotOpenError {
    return Intl.message(
      'Open shift first. Shift must be open to create orders.',
      name: 'strShiftNotOpenError',
      desc: '',
      args: [],
    );
  }

  /// `Order`
  String get strOrder {
    return Intl.message(
      'Order',
      name: 'strOrder',
      desc: '',
      args: [],
    );
  }

  /// `Accepted`
  String get strAcceptedAmount {
    return Intl.message(
      'Accepted',
      name: 'strAcceptedAmount',
      desc: '',
      args: [],
    );
  }

  /// `Manual input`
  String get strManualInput {
    return Intl.message(
      'Manual input',
      name: 'strManualInput',
      desc: '',
      args: [],
    );
  }

  /// `Payment amount`
  String get strPaymentAmount {
    return Intl.message(
      'Payment amount',
      name: 'strPaymentAmount',
      desc: '',
      args: [],
    );
  }

  /// `Subtotal`
  String get strSubtotal {
    return Intl.message(
      'Subtotal',
      name: 'strSubtotal',
      desc: '',
      args: [],
    );
  }

  /// `Hourly fee`
  String get strHourlyPayment {
    return Intl.message(
      'Hourly fee',
      name: 'strHourlyPayment',
      desc: '',
      args: [],
    );
  }

  /// `Order not found`
  String get strOrderNotFound {
    return Intl.message(
      'Order not found',
      name: 'strOrderNotFound',
      desc: '',
      args: [],
    );
  }

  /// `Confirm`
  String get strConfirm {
    return Intl.message(
      'Confirm',
      name: 'strConfirm',
      desc: '',
      args: [],
    );
  }

  /// `Enter PIN to confirm`
  String get strConfirmWithPincode {
    return Intl.message(
      'Enter PIN to confirm',
      name: 'strConfirmWithPincode',
      desc: '',
      args: [],
    );
  }

  /// `Incorrect PIN`
  String get strIncorrectPincode {
    return Intl.message(
      'Incorrect PIN',
      name: 'strIncorrectPincode',
      desc: '',
      args: [],
    );
  }

  /// `pcs`
  String get strPiecesSuffix {
    return Intl.message(
      'pcs',
      name: 'strPiecesSuffix',
      desc: '',
      args: [],
    );
  }

  /// `Change table`
  String get strChangeTable {
    return Intl.message(
      'Change table',
      name: 'strChangeTable',
      desc: '',
      args: [],
    );
  }

  /// `Select a free table to move the order to`
  String get strSelectFreeTableForTransfer {
    return Intl.message(
      'Select a free table to move the order to',
      name: 'strSelectFreeTableForTransfer',
      desc: '',
      args: [],
    );
  }

  /// `Move`
  String get strTransfer {
    return Intl.message(
      'Move',
      name: 'strTransfer',
      desc: '',
      args: [],
    );
  }

  /// `No other tables in this hall`
  String get strNoOtherTablesInHall {
    return Intl.message(
      'No other tables in this hall',
      name: 'strNoOtherTablesInHall',
      desc: '',
      args: [],
    );
  }

  /// `busy`
  String get strBusyShort {
    return Intl.message(
      'busy',
      name: 'strBusyShort',
      desc: '',
      args: [],
    );
  }

  /// `Selected table is busy`
  String get strSelectedTableIsBusy {
    return Intl.message(
      'Selected table is busy',
      name: 'strSelectedTableIsBusy',
      desc: '',
      args: [],
    );
  }

  /// `Order or table not found`
  String get strOrderOrTableNotFound {
    return Intl.message(
      'Order or table not found',
      name: 'strOrderOrTableNotFound',
      desc: '',
      args: [],
    );
  }

  /// `Cannot transfer`
  String get strCannotTransfer {
    return Intl.message(
      'Cannot transfer',
      name: 'strCannotTransfer',
      desc: '',
      args: [],
    );
  }

  /// `An error occurred`
  String get strErrorOccurred {
    return Intl.message(
      'An error occurred',
      name: 'strErrorOccurred',
      desc: '',
      args: [],
    );
  }

  /// `Order moved to another table`
  String get strOrderTransferred {
    return Intl.message(
      'Order moved to another table',
      name: 'strOrderTransferred',
      desc: '',
      args: [],
    );
  }

  /// `Clear selection`
  String get strClearSelection {
    return Intl.message(
      'Clear selection',
      name: 'strClearSelection',
      desc: '',
      args: [],
    );
  }

  /// `Current order`
  String get strCurrentOrder {
    return Intl.message(
      'Current order',
      name: 'strCurrentOrder',
      desc: '',
      args: [],
    );
  }

  /// `Pause history`
  String get strPauseHistory {
    return Intl.message(
      'Pause history',
      name: 'strPauseHistory',
      desc: '',
      args: [],
    );
  }

  /// `Opened:`
  String get strOpenedAtLabel {
    return Intl.message(
      'Opened:',
      name: 'strOpenedAtLabel',
      desc: '',
      args: [],
    );
  }

  /// `Total pause:`
  String get strTotalPause {
    return Intl.message(
      'Total pause:',
      name: 'strTotalPause',
      desc: '',
      args: [],
    );
  }

  /// `No pauses yet`
  String get strNoPauses {
    return Intl.message(
      'No pauses yet',
      name: 'strNoPauses',
      desc: '',
      args: [],
    );
  }

  /// `Special note`
  String get strSpecialNote {
    return Intl.message(
      'Special note',
      name: 'strSpecialNote',
      desc: '',
      args: [],
    );
  }

  /// `Close`
  String get strClose {
    return Intl.message(
      'Close',
      name: 'strClose',
      desc: '',
      args: [],
    );
  }

  /// `Your order is empty`
  String get strSidebarEmptyTitle {
    return Intl.message(
      'Your order is empty',
      name: 'strSidebarEmptyTitle',
      desc: '',
      args: [],
    );
  }

  /// `Price`
  String get strPrice {
    return Intl.message(
      'Price',
      name: 'strPrice',
      desc: '',
      args: [],
    );
  }

  /// `Total`
  String get strTotal {
    return Intl.message(
      'Total',
      name: 'strTotal',
      desc: '',
      args: [],
    );
  }

  /// `Freeze time charge`
  String get strFreezeTimerTitle {
    return Intl.message(
      'Freeze time charge',
      name: 'strFreezeTimerTitle',
      desc: '',
      args: [],
    );
  }

  /// `The order will be moved to a regular table. The elapsed time and accumulated amount will be preserved, but no further time charges will accrue.`
  String get strFreezeTimerBody {
    return Intl.message(
      'The order will be moved to a regular table. The elapsed time and accumulated amount will be preserved, but no further time charges will accrue.',
      name: 'strFreezeTimerBody',
      desc: '',
      args: [],
    );
  }

  /// `Freeze & transfer`
  String get strFreezeAndTransfer {
    return Intl.message(
      'Freeze & transfer',
      name: 'strFreezeAndTransfer',
      desc: '',
      args: [],
    );
  }

  /// `FROZEN`
  String get strFrozenShort {
    return Intl.message(
      'FROZEN',
      name: 'strFrozenShort',
      desc: '',
      args: [],
    );
  }

  /// `Elapsed time`
  String get strElapsedTime {
    return Intl.message(
      'Elapsed time',
      name: 'strElapsedTime',
      desc: '',
      args: [],
    );
  }

  /// `Frozen amount`
  String get strFrozenAmount {
    return Intl.message(
      'Frozen amount',
      name: 'strFrozenAmount',
      desc: '',
      args: [],
    );
  }

  /// `Available items`
  String get strAvailableItems {
    return Intl.message(
      'Available items',
      name: 'strAvailableItems',
      desc: '',
      args: [],
    );
  }

  /// `Added items`
  String get strAddedItems {
    return Intl.message(
      'Added items',
      name: 'strAddedItems',
      desc: '',
      args: [],
    );
  }

  /// `Name`
  String get strName {
    return Intl.message(
      'Name',
      name: 'strName',
      desc: '',
      args: [],
    );
  }

  /// `Unit price`
  String get strUnitPrice {
    return Intl.message(
      'Unit price',
      name: 'strUnitPrice',
      desc: '',
      args: [],
    );
  }

  /// `Total price`
  String get strTotalPrice {
    return Intl.message(
      'Total price',
      name: 'strTotalPrice',
      desc: '',
      args: [],
    );
  }

  /// `Cost`
  String get strCost {
    return Intl.message(
      'Cost',
      name: 'strCost',
      desc: '',
      args: [],
    );
  }

  /// `Manual add`
  String get strManualAdd {
    return Intl.message(
      'Manual add',
      name: 'strManualAdd',
      desc: '',
      args: [],
    );
  }

  /// `Items: {count}`
  String strItemsCount(Object count) {
    return Intl.message(
      'Items: $count',
      name: 'strItemsCount',
      desc: '',
      args: [count],
    );
  }

  /// `No rows. Add an ingredient or semi-finished item.`
  String get strNoCalculationsHint {
    return Intl.message(
      'No rows. Add an ingredient or semi-finished item.',
      name: 'strNoCalculationsHint',
      desc: '',
      args: [],
    );
  }

  /// `Shift can't be closed`
  String get strCannotCloseShiftTitle {
    return Intl.message(
      'Shift can\'t be closed',
      name: 'strCannotCloseShiftTitle',
      desc: '',
      args: [],
    );
  }

  /// `All tables must be closed before you can close the shift.`
  String get strCannotCloseShiftMessage {
    return Intl.message(
      'All tables must be closed before you can close the shift.',
      name: 'strCannotCloseShiftMessage',
      desc: '',
      args: [],
    );
  }

  /// `{count} open tables`
  String strOpenTablesCount(Object count) {
    return Intl.message(
      '$count open tables',
      name: 'strOpenTablesCount',
      desc: '',
      args: [count],
    );
  }
}

class AppLocalizationDelegate extends LocalizationsDelegate<S> {
  const AppLocalizationDelegate();

  List<Locale> get supportedLocales {
    return const <Locale>[
      Locale.fromSubtags(languageCode: 'en'),
      Locale.fromSubtags(languageCode: 'ru'),
      Locale.fromSubtags(languageCode: 'uz'),
    ];
  }

  @override
  bool isSupported(Locale locale) => _isSupported(locale);
  @override
  Future<S> load(Locale locale) => S.load(locale);
  @override
  bool shouldReload(AppLocalizationDelegate old) => false;

  bool _isSupported(Locale locale) {
    for (var supportedLocale in supportedLocales) {
      if (supportedLocale.languageCode == locale.languageCode) {
        return true;
      }
    }
    return false;
  }
}
