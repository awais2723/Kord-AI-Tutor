import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import TextContext from '@/context/TextContext';
import MathJax from '@/src/components/Latex/MathJax';

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
  const { text } = useContext(TextContext);
  const [solution, setSolution] = useState<MathSolution | null>(null);

  useEffect(() => {
    try {
      if (text) {
        // Ensure we parse double-stringified JSON if necessary
        const parsedData = typeof text === 'string' ? JSON.parse(text) : text;
        setSolution(parsedData);
      }
    } catch (e) {
      console.error('Failed to parse solution JSON', e);
    }
  }, [text]);

  const cleanTitle = (title: string) => title.replace(/^Step \d+:\s*/i, '');

  if (!solution) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500">Loading Solution...</Text>
      </SafeAreaView>
    );
  }

  const renderStep = ({ item, index }: { item: Step; index: number }) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
      <View className="flex-row items-center mb-2 border-b border-gray-100 pb-2">
        <View className="bg-violet-100 w-8 h-8 rounded-full items-center justify-center mr-3">
          <Text className="text-violet-700 font-bold">{index + 1}</Text>
        </View>
        <View className="flex-1">
          {/* Title: No display mode, just inline math */}
          <MathJax
            html={cleanTitle(item.title)}
            css={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1f2937',
              backgroundColor: '#ffffff',
            }}
          />
        </View>
      </View>

      {/* Content: Standard math */}
      <MathJax
        html={item.content}
        css={{
          fontSize: '16px',
          color: '#4b5563',
          lineHeight: '26px',
          backgroundColor: '#ffffff',
        }}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-5 pt-2">
        <Text className="text-2xl font-bold text-violet-700 mb-4 text-center">Solution</Text>

        <FlatList
          data={solution.steps}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderStep}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="bg-violet-700 rounded-xl p-5 mb-6 shadow-md">
              <Text className="text-white text-lg font-semibold mb-2 opacity-80">Overview</Text>
              <MathJax
                html={solution.overview}
                css={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  lineHeight: '24px',
                  backgroundColor: '#6d28d9',
                }}
              />
            </View>
          }
          ListFooterComponent={
            <View className="mt-4 mb-8">
              <View className="bg-green-50 border-2 border-green-500 rounded-xl p-5">
                <Text className="text-green-700 font-bold text-lg mb-2 text-center">
                  Final Answer
                </Text>

                {/* display={true} forces this to be rendered as a block equation 
                   (centered, larger, formatted as math) 
                */}
                <MathJax
                  html={solution.finalAnswer}
                  display={true}
                  css={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: '#166534',
                    backgroundColor: '#f0fdf4',
                    textAlign: 'center',
                  }}
                />
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
