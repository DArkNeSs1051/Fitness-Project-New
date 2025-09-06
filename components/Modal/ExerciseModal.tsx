// import React from 'react';
// import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
// import { Ionicons } from "@expo/vector-icons";

// const ExerciseModal = ({
//   isVisible, 
//   onClose, 
//   onSave, 
//   exercise, 
//   setExercise, 
//   detailedSets, 
//   onAddSet, 
//   onRemoveSet, 
//   onUpdateSet,
//   isEditMode = false
// }) => {
//   return (
//     <Modal
//       animationType="slide"
//       transparent={true}
//       visible={isVisible}
//       onRequestClose={onClose}
//     >
//       <View className="flex-1 justify-center items-center bg-black/50">
//         <View className="bg-white w-11/12 rounded-lg p-4">
//           <View className="flex-row justify-between items-center mb-4">
//             <Text className="text-xl font-bold">{isEditMode ? "Edit Exercise" : "Add Exercise"}</Text>
//             <TouchableOpacity onPress={onClose}>
//               <Ionicons name="close" size={24} color="black" />
//             </TouchableOpacity>
//           </View>
//           <ScrollView>
//             <TextInput
//               placeholder="Exercise Name"
//               value={exercise.exercise}
//               onChangeText={(text) => setExercise({...exercise, exercise: text})}
//               className="border border-gray-300 rounded-lg p-2 mb-2"
//             />
//             <TextInput
//               placeholder="Target Muscle Group"
//               value={exercise.target}
//               onChangeText={(text) => setExercise({...exercise, target: text})}
//               className="border border-gray-300 rounded-lg p-2 mb-2"
//             />
//             <TextInput
//               placeholder="Reps"
//               value={exercise.reps}
//               onChangeText={(text) => setExercise({...exercise, reps: text})}
//               keyboardType="numeric"
//               className="border border-gray-300 rounded-lg p-2 mb-2"
//             />
//             <TextInput
//               placeholder="Sets"
//               value={exercise.sets}
//               onChangeText={(text) => setExercise({...exercise, sets: text})}
//               keyboardType="numeric"
//               className="border border-gray-300 rounded-lg p-2 mb-2"
//             />
//             <TextInput
//               placeholder="Rest Time (e.g., 1:30)"
//               value={exercise.rest}
//               onChangeText={(text) => setExercise({...exercise, rest: text})}
//               className="border border-gray-300 rounded-lg p-2 mb-4"
//             />

//             {detailedSets.map((set, index) => (
//               <View key={set.id} className="flex-row items-center mb-2">
//                 <Text className="mr-2">Set {index + 1}</Text>
//                 <TextInput
//                   placeholder="Reps"
//                   value={set.reps.toString()}
//                   onChangeText={(text) => onUpdateSet(set.id, 'reps', text)}
//                   keyboardType="numeric"
//                   className="border border-gray-300 rounded-lg p-2 flex-1 mr-2"
//                 />
//                 <TextInput
//                   placeholder="Rest (e.g., 1:30)"
//                   value={set.rest}
//                   onChangeText={(text) => onUpdateSet(set.id, 'rest', text)}
//                   className="border border-gray-300 rounded-lg p-2 flex-1 mr-2"
//                 />
//                 <TouchableOpacity onPress={() => onRemoveSet(set.id)}>
//                   <Ionicons name="trash" size={20} color="red" />
//                 </TouchableOpacity>
//               </View>
//             ))}

//             <TouchableOpacity 
//               onPress={onAddSet}
//               className="bg-blue-100 rounded-lg p-2 items-center mb-4"
//             >
//               <Text className="text-[#42779F]">+ Add Set</Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               onPress={onSave}
//               className="bg-[#42779F] rounded-lg p-2"
//             >
//               <Text className="text-white text-center">Save Changes</Text>
//             </TouchableOpacity>
//           </ScrollView>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// export default ExerciseModal;