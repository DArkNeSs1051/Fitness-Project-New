import { Text, TouchableOpacity } from "react-native";

interface ButtonProps {
  text?: string;
  textColor?: string;
  bgColor?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const ButtonCustom = (props: ButtonProps) => {
  const { text, textColor, bgColor, icon, onClick } = props;

  return (
    <TouchableOpacity
      className={`w-[255px] h-[40px] rounded-2xl flex flex-row items-center justify-center gap-5`}
      style={{
        backgroundColor: bgColor || "#FFFFFF",
        boxShadow: "0px 1px 3px 0px #00000040",
      }}
      onPress={onClick}
    >
      {icon && icon}
      <Text
        className="text-[12px]"
        style={{
          color: textColor || "#000000",
        }}
      >
        {text || "text"}
      </Text>
    </TouchableOpacity>
  );
};

export default ButtonCustom;
