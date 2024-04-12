if [[ $1 = "" ]]; then
  echo "Error:- Missing number of containers to create as first parameter."

  return
fi

BASE_PORT_NUMBER=3000
for i in {1..$1}
do
# echo "docker container run -it -d --name node$i wlbl npm run dev"
	port=$(expr $BASE_PORT_NUMBER + $i)
	
	echo "Creating container $i at port $port in the background."
	
	docker container run -it -d -p $port:3000 --name node$i wlbl npm run dev
done

