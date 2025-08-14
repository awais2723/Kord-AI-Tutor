import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';

type TabBarIcon = {
  focused: boolean;
  color: string;
  size: number;
};

const HomeIcon = ({ focused, color, size }: TabBarIcon) => (
  <FontAwesome size={focused ? size + 8 : size + 4} name="home" color={color} />
);

const QuizIcon = ({ focused, color, size }: TabBarIcon) => (
  <MaterialIcons size={focused ? size + 8 : size + 4} name="assignment" color={color} />
);

const MeIcon = ({ focused, color, size }: TabBarIcon) => (
  <AntDesign size={focused ? size + 2 : size} name="meh" color={color} />
);

const TabLayout = () => (
  <Tabs
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#6844EE',

      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 3,
      },
    }}>
    <Tabs.Screen
      name="(stack-home)"
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: HomeIcon,
        tabBarStyle: {
          position: 'absolute',
          bottom: 5,
          backgroundColor: 'white',
          borderRadius: 10,
          borderTopColor: 'transparent',
          height: 58,
          width: '95%',
          left: '2%',
          right: '2%',
        },
      }}
    />
    <Tabs.Screen
      name="quiz"
      options={{
        tabBarLabel: 'Take Quiz',
        tabBarIcon: QuizIcon,
        tabBarStyle: {
          position: 'absolute',
          bottom: 5,
          backgroundColor: 'white',
          borderRadius: 10,
          borderTopColor: 'transparent',
          height: 58,
          width: '95%',
          left: '2.5%',
          right: '2.5%',
        },
      }}
    />
    <Tabs.Screen
      name="(stack-me)"
      options={{
        tabBarLabel: 'Me',
        tabBarIcon: MeIcon,
        tabBarStyle: {
          position: 'absolute',
          bottom: 5,
          backgroundColor: 'white',
          borderRadius: 10,
          borderTopColor: 'transparent',
          height: 58,
          width: '95%',
          left: '2.5%',
          right: '2.5%',
        },
      }}
    />
  </Tabs>
);

export default TabLayout;
