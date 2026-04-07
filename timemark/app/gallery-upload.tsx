import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { Alert } from "react-native";

interface Point {
  lat: number;   // Vĩ độ (latitude)
  lng: number;   // Kinh độ (longitude)
  time: string;  // Thời gian (time)
  order: number; // Thứ tự (order)
}

interface ResponseData {
  data: Point[]; 
}

export default function GalleryUpload() {
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mapUrl, setMapUrl] = useState<string>();

  // chọn nhiều ảnh
  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false, // Android Expo Go vẫn 1 ảnh
      quality: 1,
    });

    if (!result.canceled) {
      // 👇 cộng dồn thay vì overwrite
      setImages(prev => [...prev, ...result.assets]);
    }
  };

  // upload
  const uploadImages = async () => {
    if (!images.length) return;

    setUploading(true);

    const formData = new FormData();

    images.forEach((img, index) => {
      formData.append("images", {
        uri: img.uri,
        name: `image_${index}.jpg`,
        type: "image/jpeg",
      } as any);
    });

    try {
      const res = await fetch("http://192.168.1.33:8080/upload", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data: ResponseData = await res.json();

      const pointsString = data.data
        .map(point => `${point.lat},${point.lng},${point.time},${point.order}`)
        .join(";");
      
      const newMapUrl = `http://192.168.1.33:3000/?points=${pointsString}`;
      setMapUrl(newMapUrl);
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!mapUrl) return;

    await Clipboard.setStringAsync(mapUrl);
    Alert.alert("Đã copy!", "Link đã được copy vào clipboard");
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      
      <TouchableOpacity onPress={pickImages} style={{ padding: 12, backgroundColor: "#444", marginBottom: 10 }}>
        <Text style={{ color: "white" }}>Chọn ảnh từ gallery</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={uploadImages}
        style={{ padding: 12, backgroundColor: "green", marginBottom: 20 }}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "white" }}>Upload ảnh</Text>
        )}
      </TouchableOpacity>

      {/* preview ảnh đã chọn */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {images.map((img, i) => (
          <Image
            key={i}
            source={{ uri: img.uri }}
            style={{ width: 100, height: 100, margin: 5 }}
          />
        ))}
      </View>

      {/* kết quả URL từ server */}
      {mapUrl && (
        <View style={{ marginTop: 20 }}>
            <Text style={{ color: "blue", marginBottom: 10 }}>
            {mapUrl}
            </Text>

            <TouchableOpacity
            onPress={copyToClipboard}
            style={{
                backgroundColor: "#007bff",
                padding: 10,
                borderRadius: 6,
                alignItems: "center",
            }}
            >
            <Text style={{ color: "white" }}>Copy link</Text>
            </TouchableOpacity>
        </View>
        )}
    </ScrollView>
  );
}