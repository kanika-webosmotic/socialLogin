import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  GoogleSignin,
  GoogleSigninButton,
} from '@react-native-google-signin/google-signin';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import {LoginManager, AccessToken} from 'react-native-fbsdk-next';
import Ionicons from 'react-native-vector-icons/Ionicons';

const {width} = Dimensions.get('window');

const Login = props => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailVal, setEmailVal] = useState('');
  const [passwordVal, setPasswordVal] = useState('');
  const [userData, setUserData] = useState({});

  useEffect(() => {
    checkUser();
  }, []);

  const onPressGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      GoogleSignin.configure({
        webClientId:
          '550317109321-8dlfji3hfnomiflkttu5asefvagpj4dc.apps.googleusercontent.com',
      });
      const {accessToken, idToken, user} = await GoogleSignin.signIn();
      const credential = firebase.auth.GoogleAuthProvider.credential(
        idToken,
        accessToken,
      );
      createUser(credential);
    } catch (error) {
      console.log('error', error);
    }
  };

  const createUser = async credential => {
    const usersRef = firestore().collection('users');
    await firebase
      .auth()
      .signInWithCredential(credential)
      .then(async response => {
        Alert.alert('Login successful!');
        const res = response.user;
        const data = {
          email: res.email,
          userID: res.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
        };

        await usersRef
          .doc(res.uid)
          .set(data)
          .then(() => {
            console.log('user created');
          })
          .catch(error => {
            console.log('add user error', error);
          });
      });
  };

  async function onFBButtonPress() {
    LoginManager.logInWithPermissions(['public_profile', 'email']).then(
      async function (result) {
        if (result.isCancelled) {
          console.log('Login cancelled');
        } else {
          const data = await AccessToken.getCurrentAccessToken();
          if (!data) {
            throw 'Something went wrong obtaining access token';
          }
          const facebookCredential =
            firebase.auth.FacebookAuthProvider.credential(data.accessToken);
          createUser(facebookCredential);
        }
      },
      function (error) {
        console.log('Login fail with error: ' + error);
      },
    );
  }

  const onPressLogin = () => {
    setIsProcessing(true);
    firebase
      .auth()
      .signInWithEmailAndPassword(emailVal, passwordVal)
      .then(response => {
        const uid = response.user._user.uid;
        Alert.alert('', `login was successful. Uid:${uid}`);
        setIsProcessing(false);
        setEmailVal('');
        setPasswordVal('');
      })
      .catch(err => {
        setIsProcessing(false);
        console.log('error in login', err);
        Alert.alert('Something went wrong while login!');
      });
  };

  const checkUser = () => {
    firebase.auth().onAuthStateChanged(user => {
      if (user?._user) {
        setUserData(user._user);
      }
    });
  };

  return (
    <>
      <MaterialCommunityIcons name="puzzle" size={100} color="grey" />
      <View style={styles.loginContainer}>
        {Object.keys(userData).length ? (
          <>
            <Text>Logged in as:</Text>
            <Text>{userData?.email}</Text>
          </>
        ) : null}
        <TextInput
          value={emailVal}
          placeholder="Enter email"
          placeholderTextColor="grey"
          onChangeText={text => setEmailVal(text)}
          style={styles.inputStyle}
          autoCapitalize="none"
        />
        <TextInput
          value={passwordVal}
          placeholder="Enter password"
          placeholderTextColor="grey"
          onChangeText={text => setPasswordVal(text)}
          style={styles.inputStyle}
          secureTextEntry={true}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.buttonContainer, styles.loginButton]}
          onPress={() => onPressLogin()}
          disabled={!emailVal || !passwordVal || isProcessing}>
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.importText}>Login</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonContainer, styles.googleContainer]}
          onPress={() => onPressGoogleSignIn()}>
          <Ionicons
            style={styles.textIcon}
            size={18}
            name="logo-google"
            color={'#fff'}
          />
          <Text style={[styles.buttonText]}>Sign up with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonContainer, styles.facebookContainer]}
          onPress={() => onFBButtonPress()}>
          <Ionicons
            style={styles.textIcon}
            size={18}
            name="logo-facebook"
            color={'#fff'}
          />
          <Text style={[styles.buttonText]}>Sign up with Facebook</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
  textIcon: {
    marginRight: 8,
  },
  spacing: {
    marginTop: 20,
  },
  inputStyle: {
    borderWidth: 1,
    height: 50,
    width: '90%',
    marginTop: 20,
    borderRadius: 5,
    borderColor: 'grey',
    paddingHorizontal: 10,
  },
  loginContainer: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    marginTop: '40%',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '60%',
    borderRadius: 25,
    padding: 10,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    height: 44,
  },
  facebookContainer: {
    backgroundColor: '#4267B2',
    marginTop: 20,
  },
  googleContainer: {
    backgroundColor: '#D52D28',
    marginTop: 20,
  },
  loginButton: {
    backgroundColor: 'lightblue',
    marginTop: 20,
  },
});

export default Login;
