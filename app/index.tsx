import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#84BDEA' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return isSignedIn
    ? <Redirect href="/oauth-native-callback" />
    : <Redirect href="/auth/signin" />;
}
