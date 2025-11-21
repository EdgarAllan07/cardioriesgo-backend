import express from 'express';
import {userList,createUser,obtenerUsuario,updateUser } from '../controllers/usuario.controller.js';
const router = express.Router();
router.post('/', createUser);
router.get('/', userList);
router.get('/:id',obtenerUsuario)
router.patch('/estado/:id',updateUser)
export default router;
