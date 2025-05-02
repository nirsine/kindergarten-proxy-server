import fs from 'fs';
import util from 'util';
import variables from './variables.js'

export default {
	logPathName: "/kindergarten-proxy-server-log",
	debugLogDirFileName: "",

	//================================================================================= logging
	log(data1, data2, data3, faultLevel)
	{
		// log is allowed if only isDebugging is true or faultLevel == 2
		if (!(variables.isDebugging || faultLevel == 2)) return;

		if (this.isArrayOrObject(data1)) data1 = util.inspect(data1, {depth: Infinity, compact: false, breakLength: Infinity});
		if (this.isArrayOrObject(data2)) data2 = util.inspect(data2, {depth: Infinity, compact: false, breakLength: Infinity});
		if (this.isArrayOrObject(data3)) data3 = util.inspect(data3, {depth: Infinity, compact: false, breakLength: Infinity});

		var logData = data1 + " " + data2 + (typeof data3 != "undefined" ? (" " + data3) : "") + "\n";

		// log everything per server restart if only isDebugging
		// the file name is static, stored in variable, defined since the first log activity
	    if (variables.isDebugging)
	    {
			if (!faultLevel)
			{
				if (typeof data3 == "undefined") console.log(data1, data2);
				else console.log(data1, data2, data3);
			}
			else if (faultLevel == 1)
			{
				if (typeof data3 == "undefined") console.warn(data1, data2);
				else console.warn(data1, data2, data3);
			}
			else if (faultLevel == 2)
			{
				if (typeof data3 == "undefined") console.error(data1, data2);
				else console.error(data1, data2, data3);
			}

	    	if (!this.debugLogDirFileName)
	    	{
	    		let logFileName = this.toDateTimeFileName(new Date()) + ".txt";
	    		this.debugLogDirFileName = this.prepareDir(this.logPathName) + "/" + logFileName;
	    		fs.writeFileSync(this.debugLogDirFileName, logData);
	    	}
	    	else fs.appendFileSync(this.debugLogDirFileName, logData);
	    }

	    // log error per daily basis
	    // the file name is always be checked to make sure the date is correct
	    else if (faultLevel == 2)
	    {
			let logFileName = this.toDateFileName(new Date()) + ".txt";
	    	let logDirFileName = this.prepareDir(this.logPathName) + "/" + logFileName;

	    	if (!fs.existsSync(logDirFileName)) fs.writeFileSync(logDirFileName, logData);
	    	else fs.appendFileSync(logDirFileName, logData);
	    }
	},
	see(data1, data2, data3, faultLevel)
	{
	    if (variables.isDebugging || faultLevel)
	    {
	    	let date = this.toBeautifulTime(new Date());
			let prefix, data, suffix;

			if (typeof data3 != "undefined")
			{
				prefix = date + " " + data1;
				data = data2;
				suffix = data3;
			}
	        else if (typeof data2 != "undefined")
	        {
	        	prefix = date + " " + data1;
	        	data = data2;
	        }
	        else
	        {
	        	prefix = date;
	        	data = data1;
	        }

			this.log(prefix, data, suffix, faultLevel);
	    }

	    return typeof data2 != "undefined" ? data2 : data1;
	},
	seeThrow(message, data)
	{
		// one param
		if (typeof data == "undefined")
		{
			data = message;
			message = "error ->";
		}
		// two params
		else
		{
			message = "error -> " + message;
		}

		this.see(message, data, undefined, 2);

		return typeof data == "undefined" ? message : data;
	},
	seeWarn(message, data)
	{
		// one param
		if (typeof data == "undefined")
		{
			data = message;
			message = "warning ->";
		}
		// two params
		else
		{
			message = "warning -> " + message;
		}

		this.see(message, data, undefined, 1);

		return typeof data == "undefined" ? message : data;
	},

	//================================================================================= date time
	/**
	 * return example: 2023/01/12
	*/
	toBeautifulDate(dateTimeObject)
	{
		if (typeof dateTimeObject != "object") dateTimeObject = new Date(dateTimeObject);
		
		let year = dateTimeObject.getFullYear(),
			month = dateTimeObject.getMonth() + 1,
			date = dateTimeObject.getDate();

		return year + "/" + this.textToLength(month, 2) + "/" + this.textToLength(date, 2);
	},
	/**
	 * return example: 17:23:59:000
	*/
	toBeautifulTime(dateTimeObject)
	{
		if (typeof dateTimeObject != "object") dateTimeObject = new Date(dateTimeObject);
		
		let hours = dateTimeObject.getHours(),
			minutes = dateTimeObject.getMinutes(),
			seconds = dateTimeObject.getSeconds(),
			miliseconds = dateTimeObject.getMilliseconds();

		return this.textToLength(hours, 2) + ":" + this.textToLength(minutes, 2) + ":" + this.textToLength(seconds, 2) + ":" + this.textToLength(miliseconds, 3);
	},
	/**
	 * return example: 2023/01/12 17:23:59:000
	*/
	toBeautifulDateTime(dateTimeObject)
	{
		if (typeof dateTimeObject != "object") dateTimeObject = new Date(dateTimeObject);
		
		return this.toBeautifulDate(dateTimeObject) + " " + this.toBeautifulTime(dateTimeObject);
	},
	/**
	 * return example: 20230112-172359000
	*/
	toDateFileName(dateTimeObject)
	{
		return this.toBeautifulDate(dateTimeObject).replace(/\//g, "-");
	},
	/**
	 * return example: 20230112-172359000
	*/
	toDateTimeFileName(dateTimeObject)
	{
		return this.toBeautifulDateTime(dateTimeObject).replace(/\//g, "-").replace(/:/g, "-").replace(/ /g, ".");
	},

	//================================================================================= string
	removeTrailing(string, target)
	{
		if (string.substr(-1) == target) string = string.substr(0, string.length - 1);

		return string;
	},
	textToLength(text, length)
	{
	    if (typeof text == "undefined") return "";
	    if (typeof length == "undefined") length = 3;
	    
	    text = String(text);
	    while(text.length < length) text = "0" + text;
	    
	    return text;
	},

	//================================================================================= data
	/**
	* check criteria
	* this is a helper function
	* 
	* criteria can be
	* - id like 1 or 2
	* - array of id like [1, 2]
	* - object which contain 1 rule or more like {id: 1} or {status: 2, category: ['kiwi', 'melon'], city: new RegExp('los', 'ig')}
	* - function with item as parameter
	* 
	* item must be an object
	* 
	* returns true if only all criteria are match
	*/
	checkItemByCriteria(criteria, item, caseSensitive)
	{
		if (typeof item != "object") return false;

		// function
		if (typeof criteria == "function") return criteria(item);

		// _id, id
		else if (typeof criteria != "object") return criteria == item._id || criteria == item.id;

		// array of _id, id
		else if (Array.isArray(criteria))
		{
			for (let id of criteria)
			{
				if (id == item._id || id == item.id) return true;
			}

			return false;
		}

		// object
		var valueChecker, valueToBeChecked, caseInsensitive = !caseSensitive;

		for (var name in criteria)
		{
			valueToBeChecked = item[name];
			valueChecker = criteria[name];

			if (typeof valueToBeChecked == "undefined" || valueToBeChecked === undefined || valueToBeChecked === null)
			{
				if (valueChecker !== undefined && valueChecker !== null) return false;
			}

			if (valueChecker.constructor.name == "RegExp")
			{
				valueChecker.lastIndex = 0;
				return valueChecker.test(valueToBeChecked);
			}
			else if (Array.isArray(valueChecker))
			{
				if (valueChecker.findIndex((thisValueChecker) => {
					thisValueChecker = String(thisValueChecker);
					valueToBeChecked = String(valueToBeChecked);

					if (caseInsensitive)
					{
						thisValueChecker = thisValueChecker.toLowerCase();
						valueToBeChecked = valueToBeChecked.toLowerCase();
					}

					return thisValueChecker === valueToBeChecked;
				}) == -1) return false;
			}
			else
			{
				valueChecker = String(valueChecker);
				valueToBeChecked = String(valueToBeChecked);

				if (caseInsensitive)
				{
					valueChecker = valueChecker.toLowerCase();
					valueToBeChecked = valueToBeChecked.toLowerCase();
				}

				if (valueChecker !== valueToBeChecked) return false;
			}
		}

		return true;
	},
	/**
	* gets the all matched items within items
	*/
	countItemsByCriteria(criteria, bucket, caseSensitive, joinText)
	{
		var data = 0;
		bucket.forEach((item) => {
			if (this.checkItemByCriteria(criteria, item, caseSensitive)) data++;
		});

		return data;
	},
	/**
	* gets the all matched items within items
	*/
	getItemsByCriteria(criteria, bucket, caseSensitive, joinText)
	{
		var data = bucket.filter((item) => {
			return this.checkItemByCriteria(criteria, item, caseSensitive);
		});

		return joinText ? data.join(joinText) : data;
	},
	/**
	* gets the firstly found item within items
	*/
	getItemByCriteria(criteria, bucket, caseSensitive)
	{
		if (!bucket || !bucket.length) return null;
		else
		{
			for (let item of bucket)
			{
				if (this.checkItemByCriteria(criteria, item, caseSensitive)) return item;
			}

			return null;
		}
	},
	/**
	* check wether item exists or not within items
	*/
	itemExistsByCriteria(criteria, bucket, caseSensitive)
	{
		return this.getItemByCriteria(criteria, bucket, caseSensitive) != null;
	},
	/**
	* gets the indexes of items within items (already sorted)
	*/
	getIndexesByCriteria(criteria, bucket, caseSensitive)
	{
		return !bucket.length ? [] : bucket.map((item, index) => {
			return this.checkItemByCriteria(criteria, item, caseSensitive) ? index : false;
		}).filter((item) => {
			return item !== false;
		});
	},
	/**
	* gets the firstly found index of item within items
	*/
	getIndexByCriteria(criteria, bucket, caseSensitive)
	{
		if (!bucket || !bucket.length) return -1;
		else
		{
			for (let index in bucket)
			{
				let item = bucket[index];
				if (this.checkItemByCriteria(criteria, item, caseSensitive)) return parseInt(index);
			}

			return -1;
		}
	},

	isArray(data)
	{
		return Array.isArray(data);
	},
	isObject(data)
	{
		return typeof data == "object" && data !== null && !Array.isArray(data);
	},
	isArrayOrObject(data)
	{
		return this.isArray(data) || this.isObject(data);
	},

	//================================================================================= directory and file
	makeSureDir(path)
	{
		if (!fs.existsSync(path)) fs.mkdirSync(path);
	},
	getWorkingDir()
	{
		var workingDir = process.cwd().replace(/\\/g, "/");
		workingDir = this.removeTrailing(workingDir, "/");

		return workingDir;
	},
	/**
	 * path is relative path from server
	*/
	prepareDir(path)
	{
		var workingDir = this.getWorkingDir();
		path.split("/").forEach((pathPart) => {
			if (!pathPart) return;

			workingDir += "/" + pathPart;
			this.makeSureDir(workingDir);
		});

		return workingDir;
	},

	//================================================================================= server
	/**
	 * done
	*/
	getAllDomains(){
		var allDomains = [];
		for (let server of variables.servers)
		{
			if (server.domain)
			{
				if (!allDomains.includes(server.domain)) allDomains.push(server.domain.trim().toLowerCase());
			}
			else if (server.domains)
			{
				for (let domain of server.domains)
				{
					if (!allDomains.includes(domain)) allDomains.push(domain.trim().toLowerCase());
				}
			}
		}

		return allDomains;
	},
	/**
	 * done
	*/
	getJoinedDomains(){
		var domainsPerServer = [];
		for (let server of variables.servers)
		{
			domainsPerServer.push({
				name: server.name,
				address: server.address,
				domains: server.domain || server.domains.join(","),
			});
		}

		return domainsPerServer;
	},
	/**
	 * done
	*/
	getServerByDomain(domain){
		return this.getItemByCriteria((item) => {
			return item.domain == domain || (Array.isArray(item.domains) && item.domains.includes(domain));
		}, variables.servers);
	},
};