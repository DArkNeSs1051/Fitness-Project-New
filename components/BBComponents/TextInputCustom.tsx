import {
  View,
  Text,
  TextInput,
  TextInputProps as RNTextInputProps,
} from "react-native";

interface TextInputCustomProps extends RNTextInputProps {
  title?: string;
  classNameInput?: string;
}

const TextInputCustom = (props: TextInputCustomProps) => {
  const {
    title = "title",
    placeholder = "placeholder",
    value,
    onChangeText,
    secureTextEntry = false,
    keyboardType = "default",
    autoCapitalize = "none",
    textContentType,
    autoComplete,
    multiline = false,
    numberOfLines = 1,
    classNameInput = "bg-white w-[255px] h-[40px] rounded-2xl px-4 text-[12px]",
    ...rest
  } = props;

  return (
    <View className="flex flex-col gap-1">
      <Text className="px-3 text-[16px]">{title}</Text>
      <TextInput
        className={classNameInput}
        placeholder={placeholder}
        placeholderTextColor="#B2B3BD"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        textContentType={textContentType}
        autoComplete={autoComplete}
        multiline={multiline}
        numberOfLines={numberOfLines}
        {...rest}
      />
    </View>
  );
};

export default TextInputCustom;
