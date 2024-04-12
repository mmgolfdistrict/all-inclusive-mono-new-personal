if [[ $1 = "" ]]; then
  echo "Error:- Missing number of containers to create as first parameter."

  return
fi

for i in {1..$1}
do
# echo "docker container run -it -d --name node$i wlbl npm run dev"
	echo "Creating container $i... in the background."
	
	docker container run -it -d --name node$i wlbl npm run dev
done

