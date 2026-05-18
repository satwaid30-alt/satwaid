const { query, body, validationResult, param, header, oneOf } = require('express-validator');

exports.validate = (method) => {
    switch (method) {
        case 'check_token': {
            return [
                body('token', 'token harus ada').notEmpty(),
            ]
        }
        case 'check_filename': {
            return [
                query('filename', 'filename harus ada').notEmpty(),
            ]
        }
        case 'check_filename_body': {
            return [
                body('filename', 'filename harus ada').notEmpty(),
            ]
        }
        case 'set_status_registrant': {
            return [
                body('id_registration', 'id_registration harus ada').notEmpty(),
                body('status', 'status harus ada').notEmpty().isIn(['fit', 'register', 'accepted', 'revoked', 'rejected']).withMessage('status harus fit / register / accepted / rejected'),
                body().custom((_val) => {
                    const status = _val.status;

                    if (status === 'rejected') {
                        if (!_val.status_reason) {
                            throw new Error('alasan tidak diterima harus ada');
                        }
                        if (_val.is_rejected !== true) {
                            throw new Error('is_rejected harus true');
                        }
                    }

                    return true;
                }),
            ]
        }
        case 'create_registran': {
            return [
                body('nisn', 'nisn harus ada').notEmpty(),
                body('name', 'name harus ada').notEmpty(),
                body('place_of_birth', 'place_of_birth harus ada').notEmpty(),
                body('date_of_birth', 'date_of_birth harus ada').notEmpty(),
                body('school_name', 'school_name harus ada').notEmpty(),
                body('religion', 'religion harus ada').notEmpty(),
                body('ijazah_number', 'ijazah_number harus ada').notEmpty(),
                body('address', 'address harus ada').notEmpty(),
                body('address_code', 'address_code harus ada').notEmpty(),
                body('address_province', 'address_province harus ada').notEmpty(),
                body('address_city', 'address_city harus ada').notEmpty(),
                body('address_district', 'address_district harus ada').notEmpty(),
                body('address_subdistrict', 'address_subdistrict harus ada').notEmpty(),
                body('no_rt', 'no_rt harus ada').notEmpty(),
                body('no_rw', 'no_rw harus ada').notEmpty(),
                body('number_phone', 'phone harus ada').notEmpty(),
            ]
        }
        case 'update_registran': {
            return [
                body('id_registration', 'id_registration harus ada').notEmpty(),
                body('nisn', 'nisn harus ada').notEmpty(),
                body('name', 'name harus ada').notEmpty(),
                body('place_of_birth', 'place_of_birth harus ada').notEmpty(),
                body('date_of_birth', 'date_of_birth harus ada').notEmpty(),
                body('school_name', 'school_name harus ada').notEmpty(),
                body('religion', 'religion harus ada').notEmpty(),
                body('ijazah_number', 'ijazah_number harus ada').notEmpty(),
                body('address', 'address harus ada').notEmpty(),
                body('address_code', 'address_code harus ada').notEmpty(),
                body('address_province', 'address_province harus ada').notEmpty(),
                body('address_city', 'address_city harus ada').notEmpty(),
                body('address_district', 'address_district harus ada').notEmpty(),
                body('address_subdistrict', 'address_subdistrict harus ada').notEmpty(),
                body('no_rt', 'no_rt harus ada').notEmpty(),
                body('no_rw', 'no_rw harus ada').notEmpty(),
                body('number_phone', 'phone harus ada').notEmpty(),
            ]
        }
        case 'get_address_city': {
            return [
                query('code', 'code harus ada').notEmpty(),
            ]
        }
        case 'get_list_registrant': {
            return [
                query('target_school_npsn', 'target_school_npsn harus ada').notEmpty(),
            ]
        }
        case 'upload_file_registration': {
            return [
                body('id_registration', 'id_registration harus ada').notEmpty(),
            ]
        }
        case 'get_detail_registration': {
            return [
                param('idRegistration', 'idRegistration harus ada').notEmpty().isUUID().withMessage('harus UUID'),
            ]
        }
        case 'create_species': {
            return [
                body('slug', 'slug harus ada').notEmpty(),
                body('name', 'name harus ada').notEmpty(),
                body('category', 'category harus ada').notEmpty(),
            ]
        }
        case 'update_species': {
            return [
                param('id', 'id harus ada').notEmpty(),

                body('slug', 'slug harus ada').optional().notEmpty(),
                body('name', 'name harus ada').optional().notEmpty(),
            ]
        }
    }
}

exports.checkFileSize = (req, res, next) => {
    const maxSize = 4 * 1024 * 1024; // 4MB in bytes, adjust as needed

    try {
        if (req.files && req.files.attachment.size > maxSize) {
            return res.status(422).json({
                message: 'Ukuran File Tidak Boleh Melebihi 4MB.'
            });
        }
        return next();
    } catch (err) {
        return next(err);
    }
};

exports.closeRoute = (req, res, next) => {
    return res.status(403).json({
        message: 'Sudah Di Tutup!'
    });
}

exports.verify = (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({
                errors: errors.array()
            })
            return;
        } else {
            return next();
        }
    } catch (err) {
        return next(err);
    }
}