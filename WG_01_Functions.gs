// **********************************************
// function fcnFindDuplicateData()
//
// This function searches the entry list to find any 
// duplicate responses. To make sure we do not interfere 
// with the fcnFindMatchingData, we look for a non-zero Match ID
//
// The functions returns the Row number where the matching data was found. 
// 
// If no duplicate data is found, it returns 0;
//
// **********************************************

function fcnFindDuplicateData(ss, ConfigData, shtRspn, ResponseData, RspnRow, RspnMaxRows, shtTest) {

  // Columns Values and Parameters
  var ColMatchID = ConfigData[14][0];
  var ColPrcsd = ConfigData[15][0];
  var ColDataConflict = ConfigData[16][0];
  var ColStatus = ConfigData[17][0];
  var ColErrorMsg = ConfigData[18][0];
  var ColMatchIDLastVal = ConfigData[19][0];
  var RspnStartRow = ConfigData[20][0];
  var RspnDataInputs = ConfigData[21][0]; // from Time Stamp to Data Processed
  var NbCards = ConfigData[22][0];
  var ColNextEmptyRow = ConfigData[24][0];
  
  // Response Data
  var RspnWeek = ResponseData[0][3];
  var RspnWinr = ResponseData[0][4];
  var RspnLosr = ResponseData[0][5];

  // Entry Data
  var EntryWeek;
  var EntryWinr;
  var EntryLosr;
  var EntryData;
  var EntryPrcssd;
  var EntryMatchID;
  
  var DuplicateRow = 0;
  
  var EntryWeekData = shtRspn.getRange(1, 4, RspnMaxRows-3,1).getValues();
    
  // Loop to find if another entry has the same data
  for (var EntryRow = 1; EntryRow <= RspnMaxRows; EntryRow++){
    
    // Filters only entries of the same week the response was posted
    if (EntryWeekData[EntryRow][0] == RspnWeek){
      
      // Gets Entry Data to analyze
      EntryData = shtRspn.getRange(EntryRow+1, 1, 1, RspnDataInputs).getValues();
      
      EntryWeek = EntryData[0][3];
      EntryWinr = EntryData[0][4];
      EntryLosr = EntryData[0][5];
      EntryMatchID = EntryData[0][8];
      EntryPrcssd = EntryData[0][9];
            
      // If both rows are different, the Data Entry was processed and was compiled in the Match Results (Match as a Match ID), Look for player entry combination
      if (EntryRow != RspnRow && EntryPrcssd == 1 && EntryMatchID != ''){
        // If combination of players are the same between the entry data and the new response data, duplicate entry was found. Save Row index
        if ((RspnWinr == EntryWinr && RspnLosr == EntryLosr) || (RspnWinr == EntryLosr && RspnLosr == EntryWinr)){
          DuplicateRow = EntryRow + 1;
          EntryRow = RspnMaxRows + 1;
        }
      }
    }
        

    
    // If we do not detect any value in Week Column, we reached the end of the list and skip
    if (EntryRow <= RspnMaxRows && EntryWeekData[EntryRow][0] == ''){
      EntryRow = RspnMaxRows + 1;
    }
  }
  return DuplicateRow;
}


// **********************************************
// function fcnFindMatchingData()
//
// This function searches for the other match entry 
// in the Response Tab. The functions returns the Row number
// where the matching data was found. 
// 
// If no matching data is found, it returns 0;
//
// **********************************************

function fcnFindMatchingData(ss, ConfigData, shtRspn, ResponseData, RspnRow, RspnMaxRows, shtTest) {

  // Code Execution Options
  var OptDualSubmission = ConfigData[0][0]; // If Dual Submission is disabled, look for duplicate instead
  
  // Columns Values and Parameters
  var ColMatchID = ConfigData[8][0];
  var ColPrcsd = ConfigData[9][0];
  var ColDataConflict = ConfigData[10][0];
  var ColErrorMsg = ConfigData[11][0];
  var ColPrcsdLastVal = ConfigData[12][0];
  var ColMatchIDLastVal = ConfigData[13][0];
  var RspnStartRow = ConfigData[14][0];
  var RspnDataInputs = ConfigData[15][0]; // from Time Stamp to Data Processed
  
  var RspnPlyrSubmit = ResponseData[0][1]; // Player Submitting
  var RspnWeek = ResponseData[0][3];
  var RspnWinr = ResponseData[0][4];
  var RspnLosr = ResponseData[0][5];

  var EntryData;
  var EntryPlyrSubmit;
  var EntryWeek;
  var EntryWinr;
  var EntryLosr;
  var EntryPrcssd;
  var EntryMatchID;
  
  var DataMatchingRow = 0;
  
  var DataConflict = -1;
  
  // Loop to find if the other player posted the game results
      for (var EntryRow = RspnStartRow; EntryRow <= RspnMaxRows; EntryRow++){
        
        // Gets Entry Data to analyze
        EntryData = shtRspn.getRange(EntryRow, 1, 1, RspnDataInputs).getValues();
        
        EntryPlyrSubmit = EntryData[0][1];
        EntryWeek = EntryData[0][3];
        EntryWinr = EntryData[0][4];
        EntryLosr = EntryData[0][5];
        EntryMatchID = EntryData[0][24];
        EntryPrcssd = EntryData[0][25];
        
        // If both rows are different, Week Number, Player A and Player B are matching, we found the other match to compare data to
        if (EntryRow != RspnRow && EntryPrcssd == 1 && EntryMatchID == '' && RspnWeek == EntryWeek && RspnWinr == EntryWinr && RspnLosr == EntryLosr){

          // If Dual Submission is Enabled, look for Player Submitting, if they are different, continue          
          if ((OptDualSubmission == 'Enabled' && RspnPlyrSubmit != EntryPlyrSubmit) || OptDualSubmission == 'Disabled'){ 
            
            // Compare New Response Data and Entry Data. If Data is not equal to the other, the conflicting Data ID is returned
            DataConflict = subCheckDataConflict(ResponseData, EntryData, 1, RspnDataInputs - 4, shtTest);
            
            // 
            if (DataConflict == 0){
              // Sets Conflict Flag to 'No Conflict'
              shtRspn.getRange(RspnRow, ColDataConflict).setValue('No Conflict');
              shtRspn.getRange(EntryRow, ColDataConflict).setValue('No Conflict');
              DataMatchingRow = EntryRow;
            }
            
            // If Data Conflict was detected, sends email to notify Data Conflict
            if (DataConflict != 0 && DataConflict != -1){
              
              // Sets the Conflict Value to the Data ID value where the conflict was found
              shtRspn.getRange(RspnRow, ColDataConflict).setValue(DataConflict);
              shtRspn.getRange(EntryRow, ColDataConflict).setValue(DataConflict);
            }
          }
        }
        
        // If Dual Submission is Enabled, look for Player Submitting, if they are the same, set negative value of Entry Row as Duplicate          
        if (OptDualSubmission == 'Enabled' && RspnPlyrSubmit == EntryPlyrSubmit){
          DataMatchingRow = 0 - EntryRow;
        }

        // Loop reached the end of responses entered or found matching data
        if(EntryWeek == '' || DataMatchingRow != 0) {
          EntryRow = RspnMaxRows + 1;
        }
      }

  return DataMatchingRow;
}


// **********************************************
// function fcnPostMatchResults()
//
// Once both players have submitted their forms 
// the data in the Game Results tab are copied into
// the Week X tab
//
// **********************************************

function fcnPostMatchResultsWG(ss, ConfigData, shtRspn, ResponseData, MatchingRspnData, MatchID, MatchData, shtTest) {
  
  // Code Execution Options
  var OptDualSubmission = ConfigData[0][0]; // If Dual Submission is disabled, look for duplicate instead
  var OptPostResult = ConfigData[1][0];
  var OptPlyrMatchValidation = ConfigData[2][0];
  var OptWargame = ConfigData[4][0];
  
  // Cumulative Results sheet variables
  var shtCumul;
  var PwrLvlBonusLosr;
  
  // Match Results Sheet Variables
  var shtRslt = ss.getSheetByName('Match Results');
  var shtRsltMaxRows = shtRslt.getMaxRows();
  var shtRsltMaxCol = shtRslt.getMaxColumns();
  var RsltLastResultRowRng = shtRslt.getRange(3, 4);
  var RsltLastResultRow = RsltLastResultRowRng.getValue() + 1;
  var RsltRng = shtRslt.getRange(RsltLastResultRow, 1, 1, shtRsltMaxCol);
  var ResultData = RsltRng.getValues();
  var MatchValidWinr = new Array(2); // [0] = Status, [1] = Matches Played by Player used for Error Validation
  var MatchValidLosr = new Array(2); // [0] = Status, [1] = Matches Played by Player used for Error Validation
  var RsltPlyrDataA;
  var RsltPlyrDataB;
  var DataPostedLosr;
  
  var MatchPostedStatus = 0;
  
  // Sets which Data set is Player A and Player B. Data[0][1] = Player who posted the data
  if (OptDualSubmission == 'Enabled' && ResponseData[0][1] == ResponseData[0][2]) {
    RsltPlyrDataA = ResponseData;
    RsltPlyrDataB = MatchingRspnData;
  }
  
  if (OptDualSubmission == 'Enabled' && ResponseData[0][1] == ResponseData[0][3]) {
    RsltPlyrDataA = ResponseData;
    RsltPlyrDataB = MatchingRspnData;
  }
  
  // Copies Players Data
  ResultData[0][2] = ResponseData[0][2];  // Location
  ResultData[0][3] = ResponseData[0][3];  // Week/Round Number
  ResultData[0][4] = ResponseData[0][4];  // Winning Player
  ResultData[0][5] = ResponseData[0][5];  // Losing Player
  ResultData[0][6] = ResponseData[0][6];  // Game is Tie
  
  // If option is enabled, Validate if players are allowed to post results (look for number of games played versus total amount of games allowed
  if (OptPlyrMatchValidation == 'Enabled'){
    // Call subroutine to check if players match are valid
    MatchValidWinr = subPlayerMatchValidation(ss, ResultData[0][4], MatchValidWinr, shtTest);
    Logger.log('%s Match Validation: %s',ResultData[0][4], MatchValidWinr[0]);
    
    MatchValidLosr = subPlayerMatchValidation(ss, ResultData[0][5], MatchValidLosr,shtTest);
    Logger.log('%s Match Validation: %s',ResultData[0][5], MatchValidLosr[0]);
  }

  // If option is disabled, Consider Matches are valid
  if (OptPlyrMatchValidation == 'Disabled'){
    MatchValidWinr[0] = 1;
    MatchValidLosr[0] = 1;
  }
  
  // If both players have played a valid match
  if (MatchValidWinr[0] == 1 && MatchValidLosr[0] == 1){
    
    // Copies Match ID
    ResultData[0][1] = MatchID; // Match ID
    
    // Sets Data in Match Result Tab
    ResultData[0][shtRsltMaxCol-1] = '= if(INDIRECT("R[0]C[-6]",FALSE)<>"",1,"")';
    RsltRng.setValues(ResultData);
    
    // Update the Match Posted Status
    MatchPostedStatus = 1;
    
    // Post Results in Appropriate Week Number for Both Players
    // DataPostedLosr is an Array with [0]=Post Status (1=Success) [1]=Loser Row [2]=Power Level Column
    DataPostedLosr = fcnPostResultWeekWG(ss, ConfigData, ResultData, shtTest);
    
    // Gets New Power Level / Points Bonus for Loser from Cumulative Results Sheet
    shtCumul = ss.getSheetByName('Cumulative Results');
    PwrLvlBonusLosr = shtCumul.getRange(DataPostedLosr[1],DataPostedLosr[2]).getValue();
    Logger.log('Cumulative Power Level: %s',PwrLvlBonusLosr);
  }
  
  // If Match Validation was not successful, generate Error Status
  
  // returns Error that Winning Player is Eliminated from the League
  if (MatchValidWinr[0] == -1 && MatchValidLosr[0] == 1)  MatchPostedStatus = -11;
  
  // returns Error that Winning Player has played too many matches
  if (MatchValidWinr[0] == -2 && MatchValidLosr[0] == 1)  MatchPostedStatus = -12;  
  
  // returns Error that Losing Player is Eliminated from the League
  if (MatchValidLosr[0] == -1 && MatchValidWinr[0] == 1)  MatchPostedStatus = -21;
  
  // returns Error that Losing Player has played too many matches
  if (MatchValidLosr[0] == -2 && MatchValidWinr[0] == 1)  MatchPostedStatus = -22;
  
  // returns Error that Both Players are Eliminated from the League
  if (MatchValidWinr[0] == -1 && MatchValidLosr[0] == -1) MatchPostedStatus = -31;
  
  // returns Error that Winning Player is Eliminated from the League and Losing Player has played too many matches
  if (MatchValidWinr[0] == -1 && MatchValidLosr[0] == -2) MatchPostedStatus = -32;

  // returns Error that Winning Player has player too many matches and Losing Player is Eliminated from the League
  if (MatchValidWinr[0] == -2 && MatchValidLosr[0] == -1) MatchPostedStatus = -33;
  
  // returns Error that Both Players have played too many matches
  if (MatchValidWinr[0] == -2 && MatchValidLosr[0] == -2) MatchPostedStatus = -34;
  
  // Populates Match Data for Main Routine
  MatchData[0][0] = ResponseData[0][0]; // TimeStamp
  MatchData[0][0] = Utilities.formatDate (MatchData[0][0], Session.getScriptTimeZone(), 'YYYY-MM-dd HH:mm:ss');
  
  MatchData[1][0] = ResponseData[0][2];  // Location (Store Y/N)
  MatchData[2][0] = MatchID;             // MatchID
  MatchData[3][0] = ResponseData[0][3];  // Week/Round Number
  MatchData[4][0] = ResponseData[0][4];  // Winning Player
  MatchData[4][1] = MatchValidWinr[1];   // Winning Player Matches Played
  MatchData[5][0] = ResponseData[0][5];  // Losing Player
  MatchData[5][1] = MatchValidLosr[1];   // Losing Player Matches Played
  MatchData[5][2] = PwrLvlBonusLosr;
  MatchData[6][0] = ResponseData[0][6];  // Game is Tie
  MatchData[25][0] = MatchPostedStatus;
  
  return MatchData;
}


// **********************************************
// function fcnPostResultWeek()
//
// Once the Match Data has been posted in the 
// Match Results Tab, the Week X results are updated
// for each player
//
// **********************************************

function fcnPostResultWeekWG(ss, ConfigData, ResultData, shtTest) {

  // Code Execution Options
  var OptWargame = ConfigData[4][0];
  var cfgWeekRound = ConfigData[10][0];
  var ColPowerLevelBonus = ConfigData[23][0];
  var ColPlyr = 2;
  var ColWin = 5;
  var ColLos = 6;
  var ColLocation = 10;
  
  // function variables
  var shtWeekRslt;
  var shtWeekRsltRng;
  var shtWeekPlyr;
  var shtWeekWinrRec;
  var shtWeekWinrLoc;
  var shtWeekLosrRec;
  var shtWeekLosrLoc;
  var shtWeekMaxCol;
  var shtWeekPlyr;
  
  var cfgPowerLevel = ss.getSheetByName('Config').getRange(8,7).getValue();
  var LosrPowerLevel;
  
  var WeekWinrRow = 0;
  var WeekLosrRow = 0;
  var WeekMatchTie = 0; // Match is not a Tie by default
  var DataPostedLosr = new Array(3);
  
  var MatchLoc = ResultData[0][2];
  var MatchWeek = ResultData[0][3];
  var MatchDataWinr = ResultData[0][4];
  var MatchDataLosr = ResultData[0][5];
  var MatchDataTie  = ResultData[0][6];
  
  // Selects the appropriate Week/Round
  if(cfgWeekRound == 'Week'){
    var Week = 'Week'+MatchWeek;
    shtWeekRslt = ss.getSheetByName(Week);
  }
  if(cfgWeekRound == 'Round'){
    var Round = 'Round'+MatchWeek;
    shtWeekRslt = ss.getSheetByName(Round);
  }

  shtWeekMaxCol = shtWeekRslt.getMaxColumns();

  // Gets All Players Names
  shtWeekPlyr = shtWeekRslt.getRange(5,ColPlyr,32,1).getValues();
  
  // Find the Winning and Losing Player in the Week Result Tab
  for (var RsltRow = 5; RsltRow <= 36; RsltRow ++){
    
    if (shtWeekPlyr[RsltRow - 5][0] == MatchDataWinr) WeekWinrRow = RsltRow;
    if (shtWeekPlyr[RsltRow - 5][0] == MatchDataLosr) WeekLosrRow = RsltRow;
    
    if (WeekWinrRow != '' && WeekLosrRow != '') {
      // Get Winner and Loser Match Record, 3 values, Win, Loss, Ties
      shtWeekWinrRec = shtWeekRslt.getRange(WeekWinrRow,5,1,3).getValues();
      shtWeekWinrLoc = shtWeekRslt.getRange(WeekWinrRow,ColLocation).getValue();
      shtWeekLosrRec = shtWeekRslt.getRange(WeekLosrRow,5,1,3).getValues();
      shtWeekLosrLoc = shtWeekRslt.getRange(WeekLosrRow,ColLocation).getValue();
            
      RsltRow = 37;
    }
  }
  
  // Fill Empty Cells for both Winner and Loser
  if (shtWeekWinrRec[0][0] == '') shtWeekWinrRec[0][0] = 0; 
  if (shtWeekWinrRec[0][1] == '') shtWeekWinrRec[0][1] = 0; 
  if (shtWeekWinrRec[0][2] == '') shtWeekWinrRec[0][2] = 0; 
  if (shtWeekLosrRec[0][0] == '') shtWeekLosrRec[0][0] = 0; 
  if (shtWeekLosrRec[0][1] == '') shtWeekLosrRec[0][1] = 0; 
  if (shtWeekLosrRec[0][2] == '') shtWeekLosrRec[0][2] = 0; 
  
  // Match Tie Result
  if(ResultData[0][6] == 'Yes' || ResultData[0][6] == 'Oui'){
    WeekMatchTie = 1;  
  }
  
  // If match is not a Tie
  if(WeekMatchTie == 0){
    // Update Winning Player Results
    shtWeekWinrRec[0][0] = shtWeekWinrRec[0][0] + 1;
    // Update Losing Player Results
    shtWeekLosrRec[0][1] = shtWeekLosrRec[0][1] + 1;
  }

  // If match is a Tie
  if(WeekMatchTie == 1){
    // Update "Winning" Player Results
    shtWeekWinrRec[0][2] = shtWeekWinrRec[0][2] + 1;
    // Update "Losing" Player Results
    shtWeekLosrRec[0][2] = shtWeekLosrRec[0][2] + 1;
    }
  
  // Updates Match Location
  if (MatchLoc == 'Yes' || MatchLoc == 'Oui') {
    shtWeekWinrLoc = shtWeekWinrLoc + 1;
    shtWeekLosrLoc = shtWeekLosrLoc + 1;
  }
  
  // Update the Week Results Sheet
  shtWeekRslt.getRange(WeekWinrRow,5,1,3).setValues(shtWeekWinrRec);
  shtWeekRslt.getRange(WeekWinrRow,ColLocation).setValue(shtWeekWinrLoc);
  shtWeekRslt.getRange(WeekLosrRow,5,1,3).setValues(shtWeekLosrRec);
  shtWeekRslt.getRange(WeekLosrRow,ColLocation).setValue(shtWeekLosrLoc);
  

  // If Game Type is Wargame
  if (WeekMatchTie == 0){
    // Get Loser Amount of Power Level Bonus and Increase by value from Config file
    LosrPowerLevel = shtWeekRslt.getRange(WeekLosrRow,ColPowerLevelBonus).getValue() + cfgPowerLevel;
    shtWeekRslt.getRange(WeekLosrRow,ColPowerLevelBonus).setValue(LosrPowerLevel);
  }
  
  // Populate Data Posted for Loser
  DataPostedLosr[0]= 1;
  DataPostedLosr[1]= WeekLosrRow;
  DataPostedLosr[2]= ColPowerLevelBonus;
                 
  return DataPostedLosr;
}

// **********************************************
// function fcnUpdateStandings()
//
// Updates the Standings according to the Win % 
// from the Cumulative Results tab to the Standings Tab
//
// **********************************************

function fcnUpdateStandings(ss, shtConfig){

  var shtCumul = ss.getSheetByName('Cumulative Results');
  var shtStand = ss.getSheetByName('Standings');
  
  var SortVal = shtConfig.getRange(10,9).getValue();
  
  // Get Player Record Range
  var RngCumul = shtCumul.getRange(5,2,32,7);
  var RngStand = shtStand.getRange(6,2,32,7);
  
  // Get Cumulative Results Values and puts them in the Standings Values
  var ValCumul = RngCumul.getValues();
  RngStand.setValues(ValCumul);
  
  
  // Sorts the Standings Values by Number of Wins (column 5) and Win% (column 8)
  if(SortVal == 'WinNb'){
    RngStand.sort([{column: 5, ascending: false},{column: 8, ascending: false}]);
  }
  
  // Sorts the Standings Values by Win % (column 8) and Matches Played (column 4)
  if(SortVal == 'Win%'){
    RngStand.sort([{column: 8, ascending: false},{column: 4, ascending: false}]);
  }
}

// **********************************************
// function fcnCopyStandingsResults()
//
// This function copies all Standings and Results in 
// the spreadsheet that is accessible to players
//
// **********************************************

function fcnCopyStandingsResults(ss, shtConfig){

  var ssLgStdIDEn = shtConfig.getRange(34,2).getValue();
  var ssLgStdIDFr = shtConfig.getRange(35,2).getValue();
  
  // Open League Player Standings Spreadsheet
  var ssLgEn = SpreadsheetApp.openById(ssLgStdIDEn);
  var ssLgFr = SpreadsheetApp.openById(ssLgStdIDFr);
  
  // Match Report Form URL
  var FormUrlEN = shtConfig.getRange(19,2).getValue();
  var FormUrlFR = shtConfig.getRange(22,2).getValue();
  
  // League Name
  var Location = shtConfig.getRange(11,2).getValue();
  var LeagueTypeEN = shtConfig.getRange(13,2).getValue();
  var LeagueNameEN = Location + ' ' + LeagueTypeEN;
  var LeagueTypeFR = shtConfig.getRange(14,2).getValue();
  var LeagueNameFR = LeagueTypeFR + ' ' + Location;
  
  // Number of Players
  var NbPlayers = ss.getSheetByName('Players').getRange(2,6).getValue();
  
  // Function Variables
  var ssMstrSht;
  var ssMstrShtStartRow;
  var ssMstrShtMaxRows;
  var ssMstrShtMaxCols;
  var ssMstrShtData;
  var ssMstrStartDate;
  var ssMstrEndDate;
  var NumValues;
  var ColValues;
  
  var ssLgShtEn;
  var ssLgShtFr;
  var WeekGame;
  
  // Loops through tabs 0-8 (Standings, Cumulative Results, Week 1-7)
  for (var sht = 0; sht <=9; sht++){
    ssMstrSht = ss.getSheets()[sht];
    ssMstrShtMaxRows = ssMstrSht.getMaxRows();
    ssMstrShtMaxCols = ssMstrSht.getMaxColumns();
    
    ssLgShtEn = ssLgEn.getSheets()[sht];
    ssLgShtFr = ssLgFr.getSheets()[sht];
    
    if (sht == 0) ssMstrShtStartRow = 6;
    if (sht >= 1 && sht <= 9) ssMstrShtStartRow = 5;
    
    // Set the number of values to fetch
    NumValues = ssMstrShtMaxRows - ssMstrShtStartRow + 1;
    
    // Get Range and Data from Master and copy to Standings
    ssMstrShtData = ssMstrSht.getRange(ssMstrShtStartRow,1,NumValues,ssMstrShtMaxCols).getValues();
    ssLgShtEn.getRange(ssMstrShtStartRow,1,NumValues,ssMstrShtMaxCols).setValues(ssMstrShtData);
    ssLgShtFr.getRange(ssMstrShtStartRow,1,NumValues,ssMstrShtMaxCols).setValues(ssMstrShtData);
    
    if (sht == 0){
      // Update League Name
      ssLgShtEn.getRange(4,2).setValue(LeagueNameEN + ' Standings')
      ssLgShtFr.getRange(4,2).setValue('Classement ' + LeagueNameFR)
      // Update Form Link
      ssLgShtEn.getRange(2,5).setValue('=HYPERLINK("' + FormUrlEN + '","Send Match Results")');      
      ssLgShtFr.getRange(2,5).setValue('=HYPERLINK("' + FormUrlFR + '","Envoyer Résultats de Match")'); 
    }
    
    if (sht == 1){
      WeekGame = ssMstrSht.getRange(2,3,3,1).getValues();
      ssLgShtEn.getRange(2,3,3,1).setValues(WeekGame);
      ssLgShtFr.getRange(2,3,3,1).setValues(WeekGame);
      
      // Loop through Values in columns K and M to translate each value
      // Column K (11)
      ColValues = ssLgShtFr.getRange(ssMstrShtStartRow, 11, NumValues, 1).getValues();
      for (var row = 0 ; row < NumValues; row++){
        if (ColValues[row][0] == 'Active') ColValues[row][0] = 'Actif';
        if (ColValues[row][0] == 'Eliminated') ColValues[row][0] = 'Éliminé';
      }
      ssLgShtFr.getRange(ssMstrShtStartRow, 11, NumValues, 1).setValues(ColValues);
      
      // Loop through Values in columns K and M to translate each value
      // Column M (13)
      ColValues = ssLgShtFr.getRange(ssMstrShtStartRow, 13, NumValues, 1).getValues();
      for (var row = 0 ; row < NumValues; row++){
        if (ColValues[row][0] == 'Yes') ColValues[row][0] = 'Oui';
        if (ColValues[row][0] == 'No')  ColValues[row][0] = 'Non';
      }
      ssLgShtFr.getRange(ssMstrShtStartRow, 13, NumValues, 1).setValues(ColValues);
    }
    
    // Copy Week Dates for Week Results and Add 
    if (sht >=2){
      ssMstrStartDate = ssMstrSht.getRange(3,2).getValue();
      ssMstrEndDate   = ssMstrSht.getRange(4,2).getValue();
      ssLgShtEn.getRange(3,2).setValue('Start: ' + ssMstrStartDate);
      ssLgShtEn.getRange(4,2).setValue('End: ' + ssMstrEndDate);
      ssLgShtFr.getRange(3,2).setValue('Début: ' + ssMstrStartDate);
      ssLgShtFr.getRange(4,2).setValue('Fin: ' + ssMstrEndDate);
    }
    
    // Hide Unused Rows
    ssLgShtEn.hideRows(ssMstrShtStartRow, ssMstrShtMaxRows - ssMstrShtStartRow + 1);
    ssLgShtEn.showRows(ssMstrShtStartRow, NbPlayers);
    ssLgShtFr.hideRows(ssMstrShtStartRow, ssMstrShtMaxRows - ssMstrShtStartRow + 1);
    ssLgShtFr.showRows(ssMstrShtStartRow, NbPlayers);
  }
}


// **********************************************
// function fcnAnalyzeLossPenalty()
//
// This function analyzes all players records
// and adds a loss to a player who has not played
// the minimum amount of games. This also 
//
// **********************************************

function fcnAnalyzeLossPenalty(ss, Week, PlayerData){

  var shtCumul = ss.getSheetByName('Cumulative Results');
  var WeekShtName = 'Week'+Week;
  var shtWeek = ss.getSheetByName(WeekShtName);
  var MissingMatch;
  var Loss;
  var PlayerDataPntr = 0;
  
  var shtTest = ss.getSheetByName('Test');
  
  // Get Player Record Range
  var RngCumul = shtCumul.getRange(5,2,32,10);
  var ValCumul = RngCumul.getValues(); // 0= Player Name, 1= N/A, 2= MP, 3= Win, 4= Loss, 5= Win%, 6= Packs, 7= Status, 8= Matches Missing, 9= Warning 
  
  for (var plyr = 0; plyr < 32; plyr++){
    if (ValCumul[plyr][0] != ''){      
      if (ValCumul[plyr][8] > 0){
        // Saves Missing Match and Losses
        MissingMatch = ValCumul[plyr][8];
        Loss = ValCumul[plyr][4];
        // Updates Losses
        Loss = Loss + MissingMatch;
        
        // Updates Week Results Sheet 
        shtWeek.getRange(plyr+5,6).setValue(Loss);
        shtWeek.getRange(plyr+5,8).setValue(MissingMatch);
        
        // Saves Player and Missing Matches for Weekly Report
        PlayerData[PlayerDataPntr][0] = ValCumul[plyr][0];
        PlayerData[PlayerDataPntr][1] = MissingMatch;
        //if (PlayerData[PlayerDataPntr][0] != '') Logger.log('Player: %s - Missing: %s',PlayerData[PlayerDataPntr][0], PlayerData[PlayerDataPntr][1]);
        PlayerDataPntr++;
      }
    }
    // Exit when the loop reaches the end of the list 
    if (ValCumul[plyr][0] == '') plyr = 32;
  }
  return PlayerData;
}












