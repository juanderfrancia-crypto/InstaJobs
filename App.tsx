import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { MainTabs } from '@/navigation/MainTabs';

// Auth screens
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { PhoneScreen } from '@/screens/auth/PhoneScreen';
import { OTPScreen } from '@/screens/auth/OTPScreen';
import { RoleScreen } from '@/screens/auth/RoleScreen';
import { OnboardingScreen } from '@/screens/auth/OnboardingScreen';

// Detail screens
import { WorkerProfileScreen } from '@/screens/WorkerProfileScreen';
import { JobDetailScreen } from '@/screens/JobDetailScreen';
import { ClientProfileScreen } from '@/screens/ClientProfileScreen';
import { JobApplicationsScreen } from '@/screens/JobApplicationsScreen';
import { ReviewScreen } from '@/screens/ReviewScreen';
import { PostJobScreen } from '@/screens/PostJobScreen';

// Profile screens
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { MyActivityScreen } from '@/screens/profile/MyActivityScreen';
import { MyRatingsScreen } from '@/screens/profile/MyRatingsScreen';
import { HelpScreen } from '@/screens/profile/HelpScreen';
import { TermsScreen } from '@/screens/profile/TermsScreen';
import { ComingSoonScreen } from '@/screens/profile/ComingSoonScreen';
import { MyApplicationsScreen } from '@/screens/profile/MyApplicationsScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { session, loading, isNewUser } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Phone" component={PhoneScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
          <Stack.Screen name="Role" component={RoleScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: false }} />
        </>
      ) : isNewUser ? (
        <>
          <Stack.Screen name="Role" component={RoleScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="WorkerProfile"  component={WorkerProfileScreen}  options={{ headerShown: false }} />
          <Stack.Screen name="JobDetail"      component={JobDetailScreen}      options={{ headerShown: false }} />
          <Stack.Screen name="ClientProfile"    component={ClientProfileScreen}    options={{ headerShown: false }} />
          <Stack.Screen name="JobApplications" component={JobApplicationsScreen}  options={{ headerShown: false }} />
          <Stack.Screen name="Review"          component={ReviewScreen}           options={{ headerShown: false }} />
          <Stack.Screen name="PostJob"        component={PostJobScreen}        options={{ headerShown: false }} />
          <Stack.Screen name="EditProfile"    component={EditProfileScreen}    options={{ headerShown: false }} />
          <Stack.Screen name="MyActivity"     component={MyActivityScreen}     options={{ headerShown: false }} />
          <Stack.Screen name="MyRatings"      component={MyRatingsScreen}      options={{ headerShown: false }} />
          <Stack.Screen name="Help"           component={HelpScreen}           options={{ headerShown: false }} />
          <Stack.Screen name="Terms"          component={TermsScreen}          options={{ headerShown: false }} />
          <Stack.Screen name="ComingSoon"       component={ComingSoonScreen}       options={{ headerShown: false }} />
          <Stack.Screen name="MyApplications" component={MyApplicationsScreen}   options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
