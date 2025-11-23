import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import TextContext from '@/context/TextContext';

// Define the shape of our data

type Step = {
  title: string;
  content: string;
};

type MathSolution = {
  overview: string;
  steps: Step[];
  finalAnswer: string;
};

export default function MathResultScreen() {
  const { text } = useContext(TextContext); // This 'text' is our stringified JSON
  const [solution, setSolution] = useState<MathSolution | null>(null);

  useEffect(() => {
    try {
      if (text) {
        const parsedData = JSON.parse(text);
        setSolution(parsedData);
      }
    } catch (e) {
      console.error('Failed to parse solution JSON', e);
    }
  }, [text]);

  if (!solution) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text>Loading Solution...</Text>
      </SafeAreaView>
    );
  }

  const renderStep = ({ item, index }: { item: Step; index: number }) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
      <View className="flex-row items-center mb-2">
        <View className="bg-violet-100 w-8 h-8 rounded-full items-center justify-center mr-3">
          <Text className="text-violet-700 font-bold">{index + 1}</Text>
        </View>
        <Text className="text-lg font-bold text-gray-800 flex-1">{item.title}</Text>
      </View>
      <Text className="text-gray-600 text-base leading-6">{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-5 pt-2">
        {/* Header */}
        <Text className="text-2xl font-bold text-violet-700 mb-2 text-center">Solution</Text>

        <FlatList
          data={solution.steps}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderStep}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="bg-violet-700 rounded-xl p-5 mb-6 shadow-md">
              <Text className="text-white text-lg font-semibold mb-1 opacity-80">Overview</Text>
              <Text className="text-white text-xl font-bold leading-7">{solution.overview}</Text>
            </View>
          }
          ListFooterComponent={
            <View className="mt-4 mb-8">
              <View className="bg-green-50 border-2 border-green-500 rounded-xl p-5 items-center">
                <Text className="text-green-700 font-bold text-lg mb-1">Final Answer</Text>
                <Text className="text-green-800 text-2xl font-bold">{solution.finalAnswer}</Text>
              </View>

              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-gray-200 py-4 rounded-xl mt-6 active:bg-gray-300">
                <Text className="text-center font-bold text-gray-700">Solve Another</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
