import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW_LG } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

import { HomeScreen }    from '@/screens/HomeScreen';
import { SearchScreen }  from '@/screens/SearchScreen';
import { PostJobScreen } from '@/screens/PostJobScreen';
import { ChatsScreen }   from '@/screens/ChatsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

type TabName = 'Home' | 'Search' | 'Post' | 'Chats' | 'Profile';

const TAB_ICONS: Record<TabName, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home:    { active: 'home',         inactive: 'home-outline' },
  Search:  { active: 'search',       inactive: 'search-outline' },
  Post:    { active: 'add',          inactive: 'add' },
  Chats:   { active: 'chatbubbles',  inactive: 'chatbubbles-outline' },
  Profile: { active: 'person',       inactive: 'person-outline' },
};

function TabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? route.name;
        const isFocused = state.index === index;
        const isPost = route.name === 'Post';
        const icons = TAB_ICONS[route.name as TabName];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        if (isPost) {
          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.postTab} activeOpacity={0.85}>
              <View style={styles.postBtn}>
                <Ionicons name="add" size={28} color="#fff" />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem} activeOpacity={0.7}>
            <Ionicons
              name={isFocused ? icons?.active : icons?.inactive}
              size={22}
              color={isFocused ? COLORS.primary : COLORS.textTertiary}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
            {isFocused && <View style={styles.tabDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function MainTabs() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  useNotifications(navigation);
  const isWorker = user?.role === 'worker';

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"    component={HomeScreen}    options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Search"  component={SearchScreen}  options={{ tabBarLabel: 'Buscar' }} />
      {!isWorker && (
        <Tab.Screen name="Post" component={PostJobScreen} options={{ tabBarLabel: 'Publicar' }} />
      )}
      <Tab.Screen name="Chats"   component={ChatsScreen}   options={{ tabBarLabel: 'Chats' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    ...SHADOW_LG,
    shadowOffset: { width: 0, height: -3 },
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: { fontSize: 9, color: COLORS.textTertiary, marginTop: 1 },
  tabLabelActive: { color: COLORS.primary, fontWeight: '600' },
  tabDot: {
    position: 'absolute', bottom: -4,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  postTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  postBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW_LG,
    shadowColor: COLORS.primary,
  },
});
