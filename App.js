import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {readFile, TemporaryDirectoryPath} from 'react-native-fs';
import XLSX from 'xlsx';
import DocumentPicker from 'react-native-document-picker';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import '@react-native-firebase/auth';
import Login from './screens/Login';

const {width} = Dimensions.get('window');

const App = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createUsers = async users => {
    console.log('users', users);
    let errList = [];
    let errorMessage = '';
    const usersRef = firestore().collection('users');
    let i = 0;
    if (users.length) {
      for (i = 0; i <= users.length - 1; i++) {
        const {email, password} = users[i];
        if (email && password) {
          await firebase
            .auth()
            .createUserWithEmailAndPassword(email, password)
            .then(async response => {
              if (response.user) {
                console.log(
                  'response of create user--->',
                  response,
                  response.user.uid,
                );
                const uid = response.user.uid;
                const data = {
                  email: email,
                  userID: uid,
                  createdAt: firestore.FieldValue.serverTimestamp(),
                };

                await usersRef
                  .doc(uid)
                  .set(data)
                  .then(() => {
                    console.log('user created');
                  })
                  .catch(error => {
                    console.log('add user error', error);
                  });
              }
            })
            .catch(err => {
              errList.push(email);
              console.log('error in create user', err);
            });
        } else {
          console.log('in else');
          errorMessage = 'Please select a file with valid data!';
          setIsLoading(false);
        }
      }
      setIsLoading(false);
      console.log('done');
      if (errList.length) {
        let emailListString = '';
        errList.map(item => (emailListString = emailListString + item + '\n'));
        Alert.alert(
          'An error occurred while importing following emails',
          emailListString,
        );
      } else if (errorMessage) {
        Alert.alert('', errorMessage);
      } else {
        Alert.alert('', 'Import was completed successfully');
      }
    } else {
      setIsLoading(false);
      Alert.alert('', 'Please select a file with valid data!');
    }
  };

  const convertToJson = (res, fileType) => {
    const lines = fileType === 'csv' ? res.split('\r\n') : res.split('\n');
    const result = [];
    const headers = lines[0].split(',');
    lines.forEach((line, i) => {
      if (i !== 0) {
        const obj = {};
        const currentline = line.split(',');
        headers.forEach((header, j) => {
          obj[header] = currentline[j];
        });
        if (obj.email && obj.password) {
          result.push({...obj});
        }
      }
    });
    createUsers(result);
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.xlsx,
          DocumentPicker.types.xls,
          DocumentPicker.types.csv,
        ],
      });
      if (res.length) {
        setIsLoading(true);
        const split = res[0].fileCopyUri.split('/');
        const name = split.pop();
        const inbox = split.pop();
        const realPath =
          Platform.OS === 'ios'
            ? `file://${TemporaryDirectoryPath}/${inbox}/${decodeURI(name)}`
            : res[0].fileCopyUri;
        readSelectedFile(realPath);
      }
    } catch (err) {
      setIsLoading(false);
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker, exit any dialogs or menus and move on
      } else {
        throw err;
      }
    }
  };

  const readSelectedFile = file => {
    const fileSplit = file.split('.');
    const fileType = fileSplit[fileSplit.length - 1];
    readFile(file, 'ascii')
      .then(res => {
        if (fileType === 'csv') {
          convertToJson(res, 'csv');
        } else {
          const workbook = XLSX.read(res, {type: 'binary'});
          const wsname = workbook.SheetNames[0];
          const ws = workbook.Sheets[wsname];
          const fileData = XLSX.utils.sheet_to_csv(ws, {header: 1});
          convertToJson(fileData, 'xlsx');
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.log('err in read file', err);
      });
  };

  const renderImportButton = () => {
    return (
      <TouchableOpacity
        style={[styles.importButton, {marginTop: '10%'}]}
        onPress={() => pickFile()}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.importText}>Import Users</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* {renderImportButton()} */}
      <Login />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importButton: {
    backgroundColor: 'lightblue',
    width: width * 0.6,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 10,
  },
  importText: {
    textTransform: 'uppercase',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
