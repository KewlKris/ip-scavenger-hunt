/*
    Adapted from ip2location-nodejs
    https://github.com/ip2location/ip2location-nodejs
*/

class IP2Location {
    /**
     * The binary file of the database
     * @type {ArrayBuffer}
     */
    #database;

    #version = '8.5.0';
    #IPv4ColumnSize = 0;
    #IPv6ColumnSize = 0;
    #low = 0;
    #high = 0;
    #mid = 0;

    #maxindex = 65536;
    #IndexArrayIPv4 = Array(this.#maxindex);
    #IndexArrayIPv6 = Array(this.#maxindex);

    #country_pos = [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
    #region_pos = [0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
    #city_pos = [0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
    #isp_pos = [0, 0, 3, 0, 5, 0, 7, 5, 7, 0, 8, 0, 9, 0, 9, 0, 9, 0, 9, 7, 9, 0, 9, 7, 9, 9];
    #latitude_pos = [0, 0, 0, 0, 0, 5, 5, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
    #longitude_pos = [0, 0, 0, 0, 0, 6, 6, 0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6];
    #domain_pos = [0, 0, 0, 0, 0, 0, 0, 6, 8, 0, 9, 0, 10, 0, 10, 0, 10, 0, 10, 8, 10, 0, 10, 8, 10, 10];
    #zipcode_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 7, 7, 7, 0, 7, 0, 7, 7, 7, 0, 7, 7];
    #timezone_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 7, 8, 8, 8, 7, 8, 0, 8, 8, 8, 0, 8, 8];
    #netspeed_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 11, 0, 11, 8, 11, 0, 11, 0, 11, 0, 11, 11];
    #iddcode_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 12, 0, 12, 0, 12, 9, 12, 0, 12, 12];
    #areacode_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 13, 0, 13, 0, 13, 10, 13, 0, 13, 13];
    #weatherstationcode_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 14, 0, 14, 0, 14, 0, 14, 14];
    #weatherstationname_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 15, 0, 15, 0, 15, 0, 15, 15];
    #mcc_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 16, 0, 16, 9, 16, 16];
    #mnc_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 17, 0, 17, 10, 17, 17];
    #mobilebrand_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 18, 0, 18, 11, 18, 18];
    #elevation_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 19, 0, 19, 19];
    #usagetype_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 20, 20];
    #addresstype_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21];
    #category_pos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22];

    #country_pos_offset = 0;
    #region_pos_offset = 0;
    #city_pos_offset = 0;
    #isp_pos_offset = 0;
    #domain_pos_offset = 0;
    #zipcode_pos_offset = 0;
    #latitude_pos_offset = 0;
    #longitude_pos_offset = 0;
    #timezone_pos_offset = 0;
    #netspeed_pos_offset = 0;
    #iddcode_pos_offset = 0;
    #areacode_pos_offset = 0;
    #weatherstationcode_pos_offset = 0;
    #weatherstationname_pos_offset = 0;
    #mcc_pos_offset = 0;
    #mnc_pos_offset = 0;
    #mobilebrand_pos_offset = 0;
    #elevation_pos_offset = 0;
    #usagetype_pos_offset = 0;
    #addresstype_pos_offset = 0;
    #category_pos_offset = 0;

    #country_enabled = 0;
    #region_enabled = 0;
    #city_enabled = 0;
    #isp_enabled = 0;
    #domain_enabled = 0;
    #zipcode_enabled = 0;
    #latitude_enabled = 0;
    #longitude_enabled = 0;
    #timezone_enabled = 0;
    #netspeed_enabled = 0;
    #iddcode_enabled = 0;
    #areacode_enabled = 0;
    #weatherstationcode_enabled = 0;
    #weatherstationname_enabled = 0;
    #mcc_enabled = 0;
    #mnc_enabled = 0;
    #mobilebrand_enabled = 0;
    #elevation_enabled = 0;
    #usagetype_enabled = 0;
    #addresstype_enabled = 0;
    #category_enabled = 0;

    #MAX_IPV4_RANGE = BigInt(4294967295);
    #MAX_IPV6_RANGE = BigInt('340282366920938463463374607431768211455');
    #FROM_6TO4 = BigInt('42545680458834377588178886921629466624');
    #TO_6TO4 = BigInt('42550872755692912415807417417958686719');
    #FROM_TEREDO = BigInt('42540488161975842760550356425300246528');
    #TO_TEREDO = BigInt('42540488241204005274814694018844196863');
    #LAST_32BITS = BigInt('4294967295');

    #mydb = {
        '_DBType': 0,
        '_DBColumn': 0,
        '_DBYear': 0,
        '_DBMonth': 0,
        '_DBDay': 0,
        '_DBCount': 0,
        '_BaseAddr': 0,
        '_DBCountIPv6': 0,
        '_BaseAddrIPv6': 0,
        '_OldBIN': 0,
        '_Indexed': 0,
        '_IndexedIPv6': 0,
        '_IndexBaseAddr': 0,
        '_IndexBaseAddrIPv6': 0,
        '_ProductCode': 0,
        '_ProductType': 0,
        '_FileSize': 0
    };

    
    /**
     * Read a slice of data from the database
     * @param {Integer} readBytes 
     * @param {Integer} pos 
     * @returns {DataView}
     */
    #readrow(readBytes, pos) {
        return new DataView(this.#database.slice(pos, pos+readBytes));
    }

    /**
     * Read some binary data from the database
     * @param {Number} readBytes 
     * @param {Number} pos 
     * @param {Number} readType 
     * @param {Boolean} isbigint 
     * @returns {Number | BigInt | String}
     */
    #readbin(readBytes, pos, readType, isbigint) {
        let view = this.#readrow(readBytes, pos);
        
        switch (readType) {
            case 'int8':
                return view.getUint8(0);
            case 'int32':
                return view.getInt32(0, true);
            case 'uint32':
                let value = view.getUint32(0, true);
                return isbigint ? BigInt(value) : value;
            case 'float':
                return view.getFloat32(0, true);
            case 'str':
                return new TextDecoder().decode(view.buffer);
            case 'int128':
                let mybig = BigInt(0); // zero
                let bitshift = 8;
                for (let x = 0; x < 16; x++) {
                    mybig += BigInt(view.getUint8(x)) << BigInt((bitshift * x));
                }
                return mybig;
        }
    }

    /**
     * Read an 8 bit value from the database
     * @param {Number} pos 
     * @returns {Number}
     */
    #read8(pos) {
        return this.#readbin(1, pos - 1, 'int8');
    }

    /**
     * Read a 32 bit integer from the database
     * @param {Number} pos 
     * @param {Boolean} isbigint 
     * @returns {Number}
     */
    #read32(pos, isbigint) {
        return this.#readbin(4, pos - 1, 'uint32', isbigint);
    }

    /**
     * Read a 32 bit integer from the database
     * @param {Number} pos 
     * @param {DataView} view 
     * @returns {Number}
     */
    #read32_row(pos, view) {
        return view.getUint32(pos, true);
    }

    /**
     * Read a 32 bit float value from the database
     * @param {Number} pos 
     * @returns {Number}
     */
    #readfloat(pos) {
        return this.#readbin(4, pos - 1, 'float');
    }

    /**
     * Read a 32 bit float value from the database
     * @param {Number} pos 
     * @param {DataView} view 
     * @returns {Number}
     */
    #readfloat_row(pos, view) {
        return view.getFloat32(pos, true);
    }

    /**
     * Read a 32 or 128 bit value from the database
     * @param {Number} pos 
     * @param {Number} iptype 
     * @returns {BigInt}
     */
    #read32or128(pos, iptype) {
        if (iptype == 4) {
            return this.#read32(pos, true); // should be bigInt here already
        }
        else if (iptype == 6) {
            return this.#read128(pos); // only IPv6 will run this; already returning bigInt object
        }
        else {
            return 0;
        }
    }

    /**
     * Read a 128 bit value from the database
     * @param {Number} pos 
     * @returns {BigInt}
     */
    #read128(pos) {
        return this.#readbin(16, pos - 1, 'int128'); // returning bigInt object
    }

    /**
     * Read a string from the database
     * @param {Number} pos 
     * @returns {String}
     */
    #readstr(pos) {
        return this.#readbin(this.#readbin(1, pos, 'int8'), pos + 1, 'str');
    }

    /**
     * Convert a string IPv4 address to an integer
     * @param {String} IPv4 
     * @returns {Number}
     */
    #dot2num(IPv4) {
        let d = IPv4.split('.');
        return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
    }

    /**
     * Convert a string IPv6 address to a bigint
     * @param {String} IPv6 
     * @returns {BigInt}
     */
    #ip2no(IPv6) {
        let maxsections = 8; // should have 8 sections
        let sectionbits = 16; // 16 bits per section
        let m = IPv6.split('::');
        
        let total = BigInt(0); // zero
        
        if (m.length == 2) {
            let myarrleft = (m[0] != '') ? m[0].split(':') : [];
            let myarrright = (m[1] != '') ? m[1].split(':') : [];
            let myarrmid = maxsections - myarrleft.length - myarrright.length;
            
            for (let x = 0; x < myarrleft.length; x++) {
                total += BigInt(parseInt('0x' + myarrleft[x])) << BigInt(((maxsections - (x + 1)) * sectionbits));
            }
            
            for (let x = 0; x < myarrright.length; x++) {
                total += BigInt(parseInt('0x' + myarrright[x])) << BigInt(((myarrright.length - (x + 1)) * sectionbits));
            }
        }
        else if (m.length == 1) {
            let myarr = m[0].split(':');
            
            for (let x = 0; x < myarr.length; x++) {
                total += BigInt(BigInt(parseInt('0x' + myarr[x])) << BigInt(((maxsections - (x + 1)) * sectionbits)));
            }
        }
        
        //console.log('total', total);
        
        return total;
    }

    /**
     * Instantiate a new Ip2Location object for performing IP queries
     * @param {ArrayBuffer} database - An ArrayBuffer containing the database
     */
    constructor(database) {
        this.#database = database;

        this.#mydb._DBType = this.#read8(1);
        this.#mydb._DBColumn = this.#read8(2);
        this.#mydb._DBYear = this.#read8(3);
        this.#mydb._DBMonth = this.#read8(4);
        this.#mydb._DBDay = this.#read8(5);
        this.#mydb._DBCount = this.#read32(6);
        this.#mydb._BaseAddr = this.#read32(10);
        this.#mydb._DBCountIPv6 = this.#read32(14);
        this.#mydb._BaseAddrIPv6 = this.#read32(18);
        this.#mydb._IndexBaseAddr = this.#read32(22);
        this.#mydb._IndexBaseAddrIPv6 = this.#read32(26);
        this.#mydb._ProductCode = this.#read8(30);
        // below 2 fields just read for now, not being used yet
        this.#mydb._ProductType = this.#read8(31);
        this.#mydb._FileSize = this.#read32(32);
        
        // check if is correct BIN (should be 1 for IP2Location BIN file), also checking for zipped file (PK being the first 2 chars)
        if ((this.#mydb._ProductCode != 1 && this.#mydb._DBYear >= 21) || (this.#mydb._DBType == 80 && this.#mydb._DBColumn == 75)) { // only BINs from Jan 2021 onwards have this byte set
            throw new Error('Incorrect IP2Location BIN file format. Please make sure that you are using the latest IP2Location BIN file.');
        }
        
        if (this.#mydb._IndexBaseAddr > 0) {
            this.#mydb._Indexed = 1;
        }
        
        if (this.#mydb._DBCountIPv6 == 0) {
            this.#mydb._OldBIN = 1;
        }
        else if (this.#mydb._IndexBaseAddrIPv6 > 0) {
            this.#mydb._IndexedIPv6 = 1;
        }
        
        this.#IPv4ColumnSize = this.#mydb._DBColumn << 2; // 4 bytes each column
        this.#IPv6ColumnSize = 16 + ((this.#mydb._DBColumn - 1) << 2); // 4 bytes each column, except IPFrom column which is 16 bytes
        
        let dbt = this.#mydb._DBType;
        
        this.#country_pos_offset = (this.#country_pos[dbt] != 0) ? (this.#country_pos[dbt] - 2) << 2 : 0;
        this.#region_pos_offset = (this.#region_pos[dbt] != 0) ? (this.#region_pos[dbt] - 2) << 2 : 0;
        this.#city_pos_offset = (this.#city_pos[dbt] != 0) ? (this.#city_pos[dbt] - 2) << 2 : 0;
        this.#isp_pos_offset = (this.#isp_pos[dbt] != 0) ? (this.#isp_pos[dbt] - 2) << 2 : 0;
        this.#domain_pos_offset = (this.#domain_pos[dbt] != 0) ? (this.#domain_pos[dbt] - 2) << 2 : 0;
        this.#zipcode_pos_offset = (this.#zipcode_pos[dbt] != 0) ? (this.#zipcode_pos[dbt] - 2) << 2 : 0;
        this.#latitude_pos_offset = (this.#latitude_pos[dbt] != 0) ? (this.#latitude_pos[dbt] - 2) << 2 : 0;
        this.#longitude_pos_offset = (this.#longitude_pos[dbt] != 0) ? (this.#longitude_pos[dbt] - 2) << 2 : 0;
        this.#timezone_pos_offset = (this.#timezone_pos[dbt] != 0) ? (this.#timezone_pos[dbt] - 2) << 2 : 0;
        this.#netspeed_pos_offset = (this.#netspeed_pos[dbt] != 0) ? (this.#netspeed_pos[dbt] - 2) << 2 : 0;
        this.#iddcode_pos_offset = (this.#iddcode_pos[dbt] != 0) ? (this.#iddcode_pos[dbt] - 2) << 2 : 0;
        this.#areacode_pos_offset = (this.#areacode_pos[dbt] != 0) ? (this.#areacode_pos[dbt] - 2) << 2 : 0;
        this.#weatherstationcode_pos_offset = (this.#weatherstationcode_pos[dbt] != 0) ? (this.#weatherstationcode_pos[dbt] - 2) << 2 : 0;
        this.#weatherstationname_pos_offset = (this.#weatherstationname_pos[dbt] != 0) ? (this.#weatherstationname_pos[dbt] - 2) << 2 : 0;
        this.#mcc_pos_offset = (this.#mcc_pos[dbt] != 0) ? (this.#mcc_pos[dbt] - 2) << 2 : 0;
        this.#mnc_pos_offset = (this.#mnc_pos[dbt] != 0) ? (this.#mnc_pos[dbt] - 2) << 2 : 0;
        this.#mobilebrand_pos_offset = (this.#mobilebrand_pos[dbt] != 0) ? (this.#mobilebrand_pos[dbt] - 2) << 2 : 0;
        this.#elevation_pos_offset = (this.#elevation_pos[dbt] != 0) ? (this.#elevation_pos[dbt] - 2) << 2 : 0;
        this.#usagetype_pos_offset = (this.#usagetype_pos[dbt] != 0) ? (this.#usagetype_pos[dbt] - 2) << 2 : 0;
        this.#addresstype_pos_offset = (this.#addresstype_pos[dbt] != 0) ? (this.#addresstype_pos[dbt] - 2) << 2 : 0;
        this.#category_pos_offset = (this.#category_pos[dbt] != 0) ? (this.#category_pos[dbt] - 2) << 2 : 0;
        
        this.#country_enabled = (this.#country_pos[dbt] != 0) ? 1 : 0;
        this.#region_enabled = (this.#region_pos[dbt] != 0) ? 1 : 0;
        this.#city_enabled = (this.#city_pos[dbt] != 0) ? 1 : 0;
        this.#isp_enabled = (this.#isp_pos[dbt] != 0) ? 1 : 0;
        this.#latitude_enabled = (this.#latitude_pos[dbt] != 0) ? 1 : 0;
        this.#longitude_enabled = (this.#longitude_pos[dbt] != 0) ? 1 : 0;
        this.#domain_enabled = (this.#domain_pos[dbt] != 0) ? 1 : 0;
        this.#zipcode_enabled = (this.#zipcode_pos[dbt] != 0) ? 1 : 0;
        this.#timezone_enabled = (this.#timezone_pos[dbt] != 0) ? 1 : 0;
        this.#netspeed_enabled = (this.#netspeed_pos[dbt] != 0) ? 1 : 0;
        this.#iddcode_enabled = (this.#iddcode_pos[dbt] != 0) ? 1 : 0;
        this.#areacode_enabled = (this.#areacode_pos[dbt] != 0) ? 1 : 0;
        this.#weatherstationcode_enabled = (this.#weatherstationcode_pos[dbt] != 0) ? 1 : 0;
        this.#weatherstationname_enabled = (this.#weatherstationname_pos[dbt] != 0) ? 1 : 0;
        this.#mcc_enabled = (this.#mcc_pos[dbt] != 0) ? 1 : 0;
        this.#mnc_enabled = (this.#mnc_pos[dbt] != 0) ? 1 : 0;
        this.#mobilebrand_enabled = (this.#mobilebrand_pos[dbt] != 0) ? 1 : 0;
        this.#elevation_enabled = (this.#elevation_pos[dbt] != 0) ? 1 : 0;
        this.#usagetype_enabled = (this.#usagetype_pos[dbt] != 0) ? 1 : 0;
        this.#addresstype_enabled = (this.#addresstype_pos[dbt] != 0) ? 1 : 0;
        this.#category_enabled = (this.#category_pos[dbt] != 0) ? 1 : 0;
        
        if (this.#mydb._Indexed == 1) {
            let pointer = this.#mydb._IndexBaseAddr;
            
            for (let x = 0; x < this.#maxindex; x++) {
                this.#IndexArrayIPv4[x] = Array(2);
                this.#IndexArrayIPv4[x][0] = this.#read32(pointer);
                this.#IndexArrayIPv4[x][1] = this.#read32(pointer + 4);
                pointer += 8;
            }
            
            if (this.#mydb._IndexedIPv6 == 1) {
                for (let x = 0; x < this.#maxindex; x++) {
                    this.#IndexArrayIPv6[x] = Array(2);
                    this.#IndexArrayIPv6[x][0] = this.#read32(pointer);
                    this.#IndexArrayIPv6[x][1] = this.#read32(pointer + 4);
                    pointer += 8;
                }
            }
        }
    }

    /**
     * Load the database and initialize properties
     * @async
     */
    async load() {
        
    }

    close() {
        this.#database = undefined;
        this.#mydb._DBType = 0;
        this.#mydb._DBColumn = 0;
        this.#mydb._DBYear = 0;
        this.#mydb._DBMonth = 0;
        this.#mydb._DBDay = 0;
        this.#mydb._DBCount = 0;
        this.#mydb._BaseAddr = 0;
        this.#mydb._DBCountIPv6 = 0;
        this.#mydb._BaseAddrIPv6 = 0;
        this.#mydb._OldBIN = 0;
        this.#mydb._Indexed = 0;
        this.#mydb._IndexedIPv6 = 0;
        this.#mydb._IndexBaseAddr = 0;
        this.#mydb._IndexBaseAddrIPv6 = 0;
        this.#mydb._ProductCode = 0;
        this.#mydb._ProductType = 0;
        this.#mydb._FileSize = 0;
    }

    query(myIP, iptype, data) {
        let _DBType = this.#mydb._DBType;
        let _DBColumn = this.#mydb._DBColumn;
        this.#low = 0;
        this.#mid = 0;
        this.#high = 0;
        let MAX_IP_RANGE = BigInt(0);
        let _BaseAddr, _ColumnSize, indexaddr, ipnum;
        
        if (iptype == 4) { // IPv4
            MAX_IP_RANGE = this.#MAX_IPV4_RANGE;
            this.#high = this.#mydb._DBCount;
            _BaseAddr = this.#mydb._BaseAddr;
            _ColumnSize = this.#IPv4ColumnSize;
            ipnum = this.#dot2num(myIP);
            
            if (this.#mydb._Indexed == 1) {
                indexaddr = ipnum >>> 16;
                this.#low = this.#IndexArrayIPv4[indexaddr][0];
                this.#high = this.#IndexArrayIPv4[indexaddr][1];
            }
        }
        else if (iptype == 6) { // IPv6
            MAX_IP_RANGE = this.#MAX_IPV6_RANGE;
            this.#high = this.#mydb._DBCountIPv6;
            _BaseAddr = this.#mydb._BaseAddrIPv6;
            _ColumnSize = this.#IPv6ColumnSize;
            ipnum = this.#ip2no(myIP);
            
            if ((ipnum >= this.#FROM_6TO4 && ipnum <= this.#TO_6TO4) || (ipnum >= this.#FROM_TEREDO && ipnum <= this.#TO_TEREDO)) {
                iptype = 4;
                MAX_IP_RANGE = this.#MAX_IPV4_RANGE;
                this.#high = this.#mydb._DBCount;
                _BaseAddr = this.#mydb._BaseAddr;
                _ColumnSize = this.#IPv4ColumnSize;
                
                if (ipnum >= this.#FROM_6TO4 && ipnum <= this.#TO_6TO4) {
                    ipnum = (ipnum >> 80n) & BigInt(this.#LAST_32BITS);
                }
                else {
                    ipnum = (~ipnum) & this.#LAST_32BITS;
                }
                if (this.#mydb._Indexed == 1) {
                    indexaddr = ipnum >> 16n;
                    this.#low = this.#IndexArrayIPv4[indexaddr][0];
                    this.#high = this.#IndexArrayIPv4[indexaddr][1];
                }
            }
            else {
                if (this.#mydb._IndexedIPv6 == 1) {
                    indexaddr = ipnum >> 112n;
                    this.#low = this.#IndexArrayIPv6[indexaddr][0];
                    this.#high = this.#IndexArrayIPv6[indexaddr][1];
                }
            }
        }
        
        let MSG_NOT_SUPPORTED = 'This method is not applicable for current IP2Location binary data file. Please upgrade your subscription package to install new data file.';
        
        data.ip = myIP;
        ipnum = BigInt(ipnum);
        
        if (ipnum >= MAX_IP_RANGE) {
            ipnum = MAX_IP_RANGE - 1n;
        }
        
        data.ip_no = ipnum.toString();
        
        while (this.#low <= this.#high) {
            this.#mid = parseInt((this.#low + this.#high) / 2);
            let rowoffset = _BaseAddr + (this.#mid * _ColumnSize);
            let rowoffset2 = rowoffset + _ColumnSize;
            
            let ipfrom = this.#read32or128(rowoffset, iptype);
            let ipto = this.#read32or128(rowoffset2, iptype);
            
            ipfrom = BigInt(ipfrom);
            ipto = BigInt(ipto);
            
            if ((ipfrom <= ipnum) && (ipto > ipnum)) {
                for (let key in data) {
                    if (/^(ip|ip_no|latitude|longitude|elevation)$/i.test(key) === false) {
                        data[key] = MSG_NOT_SUPPORTED;
                    }
                    else if (/^(ip|ip_no)$/i.test(key) === false) {
                        data[key] = 0;
                    }
                }
                
                let firstcol = 4;
                if (iptype == 6) {
                    firstcol = 16;
                }

                let row = this.#readrow(_ColumnSize - firstcol, (rowoffset + firstcol) - 1);
                
                if (this.#country_enabled) {
                    let countrypos = this.#read32_row(this.#country_pos_offset, row);
                    data.country_short = this.#readstr(countrypos);
                    data.country_long = this.#readstr(countrypos + 3);
                }
                if (this.#region_enabled) {
                    data.region = this.#readstr(this.#read32_row(this.#region_pos_offset, row));
                }
                if (this.#city_enabled) {
                    data.city = this.#readstr(this.#read32_row(this.#city_pos_offset, row));
                }
                if (this.#isp_enabled) {
                    data.isp = this.#readstr(this.#read32_row(this.#isp_pos_offset, row));
                }
                if (this.#domain_enabled) {
                    data.domain = this.#readstr(this.#read32_row(this.#domain_pos_offset, row));
                }
                if (this.#zipcode_enabled) {
                    data.zipcode = this.#readstr(this.#read32_row(this.#zipcode_pos_offset, row));
                }
                if (this.#latitude_enabled) {
                    data.latitude = Math.round(this.#readfloat_row(this.#latitude_pos_offset, row) * 1000000, 6) / 1000000;
                }
                if (this.#longitude_enabled) {
                    data.longitude = Math.round(this.#readfloat_row(this.#longitude_pos_offset, row) * 1000000, 6) / 1000000;
                }
                if (this.#timezone_enabled) {
                    data.timezone = this.#readstr(this.#read32_row(this.#timezone_pos_offset, row));
                }
                if (this.#netspeed_enabled) {
                    data.netspeed = this.#readstr(this.#read32_row(this.#netspeed_pos_offset, row));
                }
                if (this.#iddcode_enabled) {
                    data.iddcode = this.#readstr(this.#read32_row(this.#iddcode_pos_offset, row));
                }
                if (this.#areacode_enabled) {
                    data.areacode = this.#readstr(this.#read32_row(this.#areacode_pos_offset, row));
                }
                if (this.#weatherstationcode_enabled) {
                    data.weatherstationcode = this.#readstr(this.#read32_row(this.#weatherstationcode_pos_offset, row));
                }
                if (this.#weatherstationname_enabled) {
                    data.weatherstationname = this.#readstr(this.#read32_row(this.#weatherstationname_pos_offset, row));
                }
                if (this.#mcc_enabled) {
                    data.mcc = this.#readstr(this.#read32_row(this.#mcc_pos_offset, row));
                }
                if (this.#mnc_enabled) {
                    data.mnc = this.#readstr(this.#read32_row(this.#mnc_pos_offset, row));
                }
                if (this.#mobilebrand_enabled) {
                    data.mobilebrand = this.#readstr(this.#read32_row(this.#mobilebrand_pos_offset, row));
                }
                if (this.#elevation_enabled) {
                    data.elevation = this.#readstr(this.#read32_row(this.#elevation_pos_offset, row));
                }
                if (this.#usagetype_enabled) {
                    data.usagetype = this.#readstr(this.#read32_row(this.#usagetype_pos_offset, row));
                }
                if (this.#addresstype_enabled) {
                    data.addresstype = this.#readstr(this.#read32_row(this.#addresstype_pos_offset, row));
                }
                if (this.#category_enabled) {
                    data.category = this.#readstr(this.#read32_row(this.#category_pos_offset, row));
                }
                data.status = 'OK';
                return;
            }
            else {
                if (ipfrom > ipnum) {
                    this.#high = this.#mid - 1;
                }
                else {
                    this.#low = this.#mid + 1;
                }
            }
        }
        data.status = 'IP_ADDRESS_NOT_FOUND';
    }

    getAll(myIP) {
        let data = {
            'ip': '?',
            'ip_no': '?',
            'country_short': '?',
            'country_long': '?',
            'region': '?',
            'city': '?',
            'isp': '?',
            'latitude': '?',
            'longitude': '?',
            'domain': '?',
            'zipcode': '?',
            'timezone': '?',
            'netspeed': '?',
            'iddcode': '?',
            'areacode': '?',
            'weatherstationcode': '?',
            'weatherstationname': '?',
            'mcc': '?',
            'mnc': '?',
            'mobilebrand': '?',
            'elevation': '?',
            'usagetype': '?',
            'addresstype': '?',
            'category': '?',
            'status': '?'
        };
        
        if (/^[:0]+:F{4}:(\d+\.){3}\d+$/i.test(myIP)) {
            myIP = myIP.replace(/^[:0]+:F{4}:/i, '');
        }
        else if (/^[:0]+F{4}(:[\dA-Z]{4}){2}$/i.test(myIP)) {
            tmp = myIP.replace(/^[:0]+F{4}:/i, '');
            tmp = tmp.replace(/:/, '');
            tmparr = [];
            for (let x = 0; x < 8; x = x + 2) {
                tmparr.push(parseInt('0x' + tmp.substring(x, x + 2)));
            }
            myIP = tmparr.join('.');
        }
        let iptype = (myIP.indexOf(':') == -1) ? 4 : 6;
        
        if (iptype == 0) {
            data.status = 'INVALID_IP_ADDRESS';
            return data;
        }
        else if (this.#mydb._DBType == 0) {
            data.status = 'RUN_INIT_FIRST';
            return data;
        }
        else if ((iptype == 6) && (this.#mydb._OldBIN == 1)) {
            data.status = 'IPV6_NOT_SUPPORTED';
            return data;
        }
        else {
            this.query(myIP, iptype, data);
            return data;
        }
    }

    getCountryShort(myIP) {
        data = this.getAll(myIP);
        return data.country_short;
    }

    getCountryLong(myIP) {
        data = this.getAll(myIP);
        return data.country_long;
    }

    getRegion(myIP) {
        data = this.getAll(myIP);
        return data.region;
    }

    getCity(myIP) {
        data = this.getAll(myIP);
        return data.city;
    }

    getISP(myIP) {
        data = this.getAll(myIP);
        return data.isp;
    }

    getLatitude(myIP) {
        data = this.getAll(myIP);
        return data.latitude;
    }

    getLongitude(myIP) {
        data = this.getAll(myIP);
        return data.longitude;
    }

    getDomain(myIP) {
        data = this.getAll(myIP);
        return data.domain;
    }

    getZipcode(myIP) {
        data = this.getAll(myIP);
        return data.zipcode;
    }

    getTimezone(myIP) {
        data = this.getAll(myIP);
        return data.timezone;
    }

    getNetSpeed(myIP) {
        data = this.getAll(myIP);
        return data.netspeed;
    }

    getIddCode(myIP) {
        data = this.getAll(myIP);
        return data.iddcode;
    }

    getAreaCode(myIP) {
        data = this.getAll(myIP);
        return data.areacode;
    }

    getWeatherStationCode(myIP) {
        data = this.getAll(myIP);
        return data.weatherstationcode;
    }

    getWeatherStationName(myIP) {
        data = this.getAll(myIP);
        return data.weatherstationname;
    }

    getMCC(myIP) {
        data = this.getAll(myIP);
        return data.mcc;
    }

    getMNC(myIP) {
        data = this.getAll(myIP);
        return data.mnc;
    }

    getMobileBrand(myIP) {
        data = this.getAll(myIP);
        return data.mobilebrand;
    }

    getElevation(myIP) {
        data = this.getAll(myIP);
        return data.elevation;
    }

    getUsageType(myIP) {
        data = this.getAll(myIP);
        return data.usagetype;
    }

    getAddressType(myIP) {
        data = this.getAll(myIP);
        return data.addresstype;
    }

    getCategory(myIP) {
        data = this.getAll(myIP);
        return data.category;
    }
}

export default IP2Location;