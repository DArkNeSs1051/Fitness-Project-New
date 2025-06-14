// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// // Screen components
// import RoutinesScreen from '../screen/Routinescreen';
// import LibraryScreen from '../screen/Libraryscreen';
// import WorkoutScreen from '../screen/WorkoutScreen/WorkoutIndexScreen';
// import DietPlanScreen from '../screen/Dietscreen';
// import AccountScreen from '../screen/Accountscreen';

// // Custom Bottom Navigator
// import BottomNavigator from './BottomNavigator';

// // Types for navigation
// export type BottomTabParamList = {
//   Routines: undefined;
//   Library: undefined;
//   Workout: undefined;
//   DietPlan: undefined;
//   Account: undefined;
// };

// const Tab = createBottomTabNavigator<BottomTabParamList>();

// const TabNavigator = () => {
//   return (
//     <Tab.Navigator
//       initialRouteName="Workout"
//       screenOptions={{
//         headerShown: false,
//         tabBarStyle: { display: 'none' }, // Hide default tab bar
//       }}
//       tabBar={(props) => (
//         <BottomNavigator activeTab={props.state.routes[props.state.index].name as keyof BottomTabParamList} />
//       )}
//     >
//       <Tab.Screen name="Routines" component={RoutinesScreen} />
//       <Tab.Screen name="Library" component={LibraryScreen} />
//       <Tab.Screen name="Workout" component={WorkoutScreen} />
//       <Tab.Screen name="DietPlan" component={DietPlanScreen} />
//       <Tab.Screen name="Account" component={AccountScreen} />
//     </Tab.Navigator>
//   );
// };

// export default TabNavigator;
