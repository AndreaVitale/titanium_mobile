/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_GEOLOCATION
#import <JavaScriptCore/JavaScriptCore.h>
#import <TitaniumKit/ObjcProxy.h>

#import <CoreLocation/CoreLocation.h>

NSString *const kTiGeolocationUsageDescriptionWhenInUse = @"NSLocationWhenInUseUsageDescription";
NSString *const kTiGeolocationUsageDescriptionAlways = @"NSLocationAlwaysUsageDescription";
NSString *const kTiGeolocationUsageDescriptionAlwaysAndWhenInUse = @"NSLocationAlwaysAndWhenInUseUsageDescription";
NSString *const kTiGeolocationTemporaryUsageDescriptionDictionary = @"NSLocationTemporaryUsageDescriptionDictionary";

@protocol GeolocationExports <JSExport>

// accuracy constants
CONSTANT(NSNumber *, ACCURACY_BEST_FOR_NAVIGATION);
CONSTANT(NSNumber *, ACCURACY_HIGH);
CONSTANT(NSNumber *, ACCURACY_LOW);
CONSTANT(NSNumber *, ACCURACY_REDUCED);

// iOS-specific values, (deprecated on Android)
CONSTANT(NSNumber *, ACCURACY_BEST);
CONSTANT(NSNumber *, ACCURACY_HUNDRED_METERS);
CONSTANT(NSNumber *, ACCURACY_KILOMETER);
CONSTANT(NSNumber *, ACCURACY_NEAREST_TEN_METERS);
CONSTANT(NSNumber *, ACCURACY_THREE_KILOMETERS);

// To specify the geolocation activity type
CONSTANT(NSNumber *, ACTIVITYTYPE_AUTOMOTIVE_NAVIGATION); // for automotive navigation
CONSTANT(NSNumber *, ACTIVITYTYPE_FITNESS); // includes any pedestrian activities
CONSTANT(NSNumber *, ACTIVITYTYPE_OTHER); // default
CONSTANT(NSNumber *, ACTIVITYTYPE_OTHER_NAVIGATION); // for other navigation cases (excluding pedestrian navigation), e.g. navigation for boats, trains or planes.

// Authorization to use location
CONSTANT(NSNumber *, AUTHORIZATION_ALWAYS);
CONSTANT(NSNumber *, AUTHORIZATION_DENIED);
CONSTANT(NSNumber *, AUTHORIZATION_RESTRICTED);
CONSTANT(NSNumber *, AUTHORIZATION_UNKNOWN);
CONSTANT(NSNumber *, AUTHORIZATION_WHEN_IN_USE);

//Accuracy Authorization to use location
CONSTANT(NSNumber *, ACCURACY_AUTHORIZATION_FULL);
CONSTANT(NSNumber *, ACCURACY_AUTHORIZATION_REDUCED);

// Error codes
CONSTANT(NSNumber *, ERROR_DENIED);
CONSTANT(NSNumber *, ERROR_HEADING_FAILURE);
CONSTANT(NSNumber *, ERROR_LOCATION_UNKNOWN);
CONSTANT(NSNumber *, ERROR_NETWORK);

CONSTANT(NSNumber *, ERROR_REGION_MONITORING_DELAYED);
CONSTANT(NSNumber *, ERROR_REGION_MONITORING_DENIED);
CONSTANT(NSNumber *, ERROR_REGION_MONITORING_FAILURE);

// Properties
PROPERTY(CLLocationAccuracy, accuracy, Accuracy);
PROPERTY(CLActivityType, activityType, ActivityType);
PROPERTY(bool, allowsBackgroundLocationUpdates, AllowsBackgroundLocationUpdates);
PROPERTY(CLLocationDistance, distanceFilter, DistanceFilter);
READONLY_PROPERTY(bool, hasCompass, HasCompass);
PROPERTY(CLLocationDegrees, headingFilter, HeadingFilter);
READONLY_PROPERTY(NSString *, lastGeolocation, LastGeolocation);
READONLY_PROPERTY(CLAuthorizationStatus, locationServicesAuthorization, LocationServicesAuthorization);
#if IS_SDK_IOS_14
READONLY_PROPERTY(CLAccuracyAuthorization, locationAccuracyAuthorization, AccuracyAuthorization);
#endif
READONLY_PROPERTY(bool, locationServicesEnabled, LocationServicesEnabled);
PROPERTY(bool, pauseLocationUpdateAutomatically, PauseLocationUpdateAutomatically);
PROPERTY(bool, showBackgroundLocationIndicator, ShowBackgroundLocationIndicator);
PROPERTY(bool, showCalibration, ShowCalibration);
PROPERTY(bool, trackSignificantLocationChange, TrackSignificantLocationChange);

// methods
JSExportAs(forwardGeocoder,
           -(void)forwardGeocoder
           : (NSString *)address withCallback
           : (JSValue *)callback);
- (void)getCurrentHeading:(JSValue *)callback;
- (void)getCurrentPosition:(JSValue *)callback;
- (bool)hasLocationPermissions:(CLAuthorizationStatus)authorizationType;
JSExportAs(requestLocationPermissions,
           -(void)requestLocationPermissions
           : (CLAuthorizationStatus)authorizationType withCallback
           : (JSValue *)callback);
JSExportAs(reverseGeocoder,
           -(void)reverseGeocoder
           : (double)latitude longitude
           : (double)longitude withCallback
           : (JSValue *)callback);

#if IS_SDK_IOS_14
JSExportAs(requestTemporaryFullAccuracyAuthorization,
           -(void)requestTemporaryFullAccuracyAuthorization
           : (NSString *)purposeString withCallback
           : (JSValue *)callback);
#endif
@end

@interface GeolocationModule : ObjcProxy <GeolocationExports, CLLocationManagerDelegate> {
  CLLocationManager *locationManager;
  CLLocationManager *tempManager; // Our 'fakey' manager for handling certain <=3.2 requests
  CLLocationManager *locationPermissionManager; // used for just permissions requests

  CLLocationAccuracy accuracy;
  CLLocationDistance distance;
  CLLocationDegrees heading;
  NSMutableArray *singleHeading;
  NSMutableArray *singleLocation;
  NSString *purpose; // the reason for using Location services
  BOOL trackingHeading;
  BOOL trackingLocation;
  BOOL trackSignificantLocationChange;
  bool allowsBackgroundLocationUpdates;
  BOOL showBackgroundLocationIndicator;
  JSManagedValue *authorizationCallback;
  CLAuthorizationStatus requestedAuthorizationStatus;

  CLActivityType activityType;
  BOOL pauseLocationUpdateAutomatically;
  NSDictionary *lastLocationDict;
  NSRecursiveLock *lock;
}

@end

#endif
