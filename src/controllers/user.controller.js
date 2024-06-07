'use strict';

import User from '../models/user.model.js';
import { autoAccount } from './account.controller.js';
import { encrypt, checkPassword } from '../helpers/validator.js';
import { generateJwt } from '../helpers/jwt.js';
import { getIdProf } from './profession.controller.js';

//TODO: agregar la creación de la cuenta y ligarla al usuario

export const newAdmin = async (req, res) => {
  try {
    let data = req.body;
    data.role = 'ADMIN';
    data.password = await encrypt(data.password);
    let admin = new User(data);
    await admin.save();
    return res
      .status(200)
      .send({ message: 'Administrador agregado con exito' });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ message: 'Error al agregar el nuevo administrador' });
  }
};

export const newUser = async (req, res) => {
  try {
    let data = req.body;
    data.role = 'CLIENT';
    data.password = await encrypt(data.password);
    let user = new User(data);
    await user.save();
    let idUser = await User.findOne({ username: data.username });
    await autoAccount(idUser.idUser);
    return res.status(200).send({ message: 'Usuario registrado con exito' });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ message: 'Error al agregar el nuevo usuario' });
  }
};

export const newProfessional = async (req, res) => {
  try {
    let data = req.body;
    data.role = 'PROFESSIONAL';
    data.password = await encrypt(data.password);
    let user = new User(data);
    await user.save();
    let idUser = await User.findOne({ username: data.username });
    await autoAccount(idUser.idUser);
    return res
      .status(200)
      .send({ message: 'Profesional agregado exitosamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'Error al agregar su cuenta' });
  }
};

export const userDefault = async (
  profilePicture,
  name,
  surname,
  email,
  username,
  password,
  phone,
  locality,
  profession,
  rol,
) => {
  try {
    let tam = profession;
    let data;
    let foundUser = await User.findOne({ email: email, username: username });
    if (!foundUser) {
      if (tam.length > 0) {
        let prof = await getIdProf(profession);
        data = {
          profilePicture: profilePicture,
          name: name,
          surname: surname,
          email: email,
          username: username,
          password: await encrypt(password),
          phone: phone,
          locality: locality,
          profession: prof._id,
          role: rol,
          tp_status: 'ACTIVE',
        };
      } else {
        data = {
          profilePicture: profilePicture,
          name: name,
          surname: surname,
          email: email,
          username: username,
          password: await encrypt(password),
          phone: phone,
          locality: locality,
          role: rol,
          tp_status: 'ACTIVE',
        };
      }
      let user = new User(data);
      await user.save();
      return console.log('Usuario registrado con exito');
    } else {
      console.log('Este usuario default ya ha sido creado anteriormente');
    }
  } catch (err) {
    console.error(err);
    console.log('Error al agregar el usuario default');
  }
};

export const dataUser = async (req, res) => {
  try {
    let { id } = req.params;
    let foundedData = await User.findOne({ _id: id });
    if (!foundedData) {
      return res.status(404).send({ message: 'Usuario no encontrado' });
    }
    return res.status(200).send({ foundedData });
  } catch (err) {
    console.error(err);
    return res.status.send({
      message: 'Error al obtener la información del usuario',
    });
  }
};

export const login = async (req, res) => {
  try {
    let { username, password } = req.body;
    let user = await User.findOne({
      $or: [
        {
          username,
          username,
        },
        {
          email: username,
        },
      ],
      tp_status: 'ACTIVE',
    });
    if (user && (await checkPassword(password, user.password))) {
      let loggedUser = {
        uid: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
      };
      let token = await generateJwt(loggedUser);
      return res.send({
        message: `Bienvenido ${loggedUser.username}`,
        loggedUser,
        token,
      });
    }
    return res.status(404).send({ message: 'Credenciales invalidas' });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'Error al logear' });
  }
};

export const update = async (req, res) => {
  try {
    let { id } = req.params;
    let data = req.body;
    if (data.role) {
      return res.status(401).send({ message: 'No puede actualizar su rol' });
    } else {
      if (data.password && data.passwordConfirm) {
        if (data.password !== data.passwordConfirm) {
          return res.status(400).send({
            message: 'Las contraseñas no coinciden',
          });
        }
        data.password = await encrypt(data.passwordConfirm);
        delete data.passwordConfirm;
      } else {
        delete data.password;
        delete data.passwordConfirm;
      }
      let updatedUser = await User.findOneAndUpdate({ _id: id }, data, {
        new: true,
      });
      if (!updatedUser) {
        return res
          .status(404)
          .send({ message: 'Usuario no encontrado, no se ha actualizado' });
      }
      return res
        .status(200)
        .send({ message: 'Usuario actualizado', updatedUser });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ message: 'Error al actualizar el perfil del usuario' });
  }
};

export const getUsers = async (req, res) => {
  try {
    let users = await User.find({ tp_status: 'ACTIVE' });
    if (!users)
      return res
        .status(404)
        .send({ message: 'No hay usuarios en la aplicación' });
    return res.status(200).send({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'Error al obtener los usuarios' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    let { id } = req.params;
    let data = {
      tp_status: 'DELETED',
    };
    let deletedUser = await User.findOneAndUpdate(
      { _id: id, tp_status: 'ACTIVE' },
      data,
      { new: true },
    );
    if (!deletedUser)
      return res
        .status(404)
        .send({ message: 'Usuario no encontrado, no se ha actualizado' });
    return res.status(200).send({ message: 'Usuario eliminado con exito' });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ message: 'Error al eliminar la cuenta del usuario' });
  }
};

export const getProf = async (req, res) => {
  try {
    let foundedProf = await User.find({
      role: 'PROFESSIONAL',
      tp_status: 'ACTIVE',
    });
    if (!foundedProf)
      return res
        .status(404)
        .send({ message: 'No se han encontrado profesionales' });
    return res.status(200).send({ foundedProf });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ message: 'Error al obtener los profesionales' });
  }
};
