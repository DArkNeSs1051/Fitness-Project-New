import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { shadows } from '~/utils/shadow';

export default function FitnessTestScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding:20, backgroundColor: '#84BDEA' }}>
        <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={30} color="white" />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, marginTop: 50 }}>
            Choose Your Fitness Test Method
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
            onPress={() => router.push('/account/fitness_test/questionnaire')}
            style={{
                flex: 1,
                backgroundColor: '#2c5575',
                padding: 24,
                borderRadius: 12,
                marginRight: 10,
                justifyContent: 'center',
                alignItems: 'center',
                ...shadows.large
            }}
            >
                <Ionicons className='m-2' name='document-text-outline' size={100} color="#FFFFFF" />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                    Questionnaire
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
            onPress={() => router.push('/account/fitness_test/physicalTest')}
            style={{
                flex: 1,
                backgroundColor: '#2c5575',
                padding: 24,
                borderRadius: 12,
                marginLeft: 10,
                justifyContent: 'center',
                alignItems: 'center',
                ...shadows.large
            }}
            >
                <Ionicons className='m-2' name='barbell-outline' size={100} color="#FFFFFF" />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                    Physical Test
                </Text>
            </TouchableOpacity>
        </View>
    </View>
  );
}
