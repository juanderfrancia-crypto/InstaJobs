import React from 'react';
import { StatusBar, View, Text, ScrollView, StyleSheet } from 'react-native';
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

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <View style={eb.container}>
          <Text style={eb.title}>Error al iniciar</Text>
          <ScrollView>
            <Text style={eb.msg}>{err.message}</Text>
            <Text style={eb.stack}>{err.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
const eb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', padding: 20, paddingTop: 60 },
  title: { color: '#FF6B6B', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  msg: { color: '#fff', fontSize: 14, marginBottom: 12 },
  stack: { color: '#aaa', fontSize: 11, lineHeight: 16 },
});

function RootNavigator() {
  const { session, loading, isNewUser } = useAuth();

  if (loading) return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;

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
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
