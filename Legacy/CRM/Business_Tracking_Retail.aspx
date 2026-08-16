<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_Tracking_Retail.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Medium"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div align="center">
                    
                    <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                        Width="1176px">
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                                      <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" Width="1170px">
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="RETAIL BUSINESS TRACKING" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td style="width: 1025px" align="right">
                                                    <asp:Label ID="Label141" runat="server" Text="Search by"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    <telerik:RadComboBox ID="cbosearch" Runat="server" AllowCustomText="True" 
                                                        AutoPostBack="True" MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Text="Proposer Name" Value="P" 
                                                                Selected="True" />
                                                            <telerik:RadComboBoxItem runat="server" Text="File No." Value="F" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 264px">
                                                    <telerik:RadTextBox ID="txtsearch" Runat="server" Skin="Web20" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td>
                                                    <telerik:RadButton ID="btnsearch" runat="server" Text="Search" Skin="Simple">
                                                    </telerik:RadButton>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel16" runat="server">
                                            <table style="width: 100%">
                                                <tr>
                                                    <td colspan="4" style="height: 40px">
                                                        <asp:Label ID="Label145" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                            Text="Proposer Details"></asp:Label>
                                                        <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                            style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        &nbsp;</td>
                                                    <td class="style17" style="width: 431px">
                                                        <asp:CheckBox ID="chkwalkin" runat="server" 
                                                            Font-Size="Small" style="color: #FF0000; background-color: #FFFFFF" 
                                                            Text="Walk-in Client (Customer Service Only)" />
                                                    </td>
                                                    <td class="style17" style="width: 132px">
                                                        <asp:Label ID="Label32" runat="server" Text="Receive Date"></asp:Label>
                                                    </td>
                                                    <td>
                                                        <telerik:RadDatePicker ID="dtreceivedate" Runat="server" Enabled="False" 
                                                            MinDate="" Skin="Web20">
                                                            <Calendar Skin="Web20" UseColumnHeadersAsSelectors="False" 
                                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                            </Calendar>
                                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                            </DateInput>
                                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                        </telerik:RadDatePicker>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        <asp:Label ID="Label30" runat="server" Text="Proposer Name"></asp:Label>
                                                    </td>
                                                    <td class="style17" style="width: 431px">
                                                        <telerik:RadTextBox ID="txtProposer" Runat="server" Skin="Web20" Width="250px">
                                                        </telerik:RadTextBox>
                                                    </td>
                                                    <td class="style17" style="width: 132px">
                                                        <asp:Label ID="Label173" runat="server" Text="NID"></asp:Label>
                                                    </td>
                                                    <td>
                                                        <telerik:RadTextBox ID="txtNID" Runat="server" Skin="Web20" Width="250px">
                                                        </telerik:RadTextBox>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        <asp:Label ID="Label149" runat="server" Text="Client Type"></asp:Label>
                                                    </td>
                                                    <td class="style17" style="width: 431px">
                                                        <telerik:RadComboBox ID="cboclient" Runat="server" Skin="Web20" Width="190px">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" Selected="True" Text="Retail" 
                                                                    Value="R" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                    </td>
                                                    <td class="style17" style="width: 132px">
                                                        <asp:Label ID="Label174" runat="server" Text="PIN NO"></asp:Label>
                                                    </td>
                                                    <td>
                                                        <telerik:RadTextBox ID="txt_PIN" Runat="server" Skin="Web20" Width="250px">
                                                        </telerik:RadTextBox>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        <asp:Label ID="Label14" runat="server" Text="Agent/Broker"></asp:Label>
                                                    </td>
                                                    <td class="style17" style="width: 431px">
                                                        <telerik:RadComboBox ID="cboagent" Runat="server" AccessibilityMode="True" 
                                                            AllowCustomText="True" MarkFirstMatch="True" Skin="Web20" Width="300px">
                                                        </telerik:RadComboBox>
                                                    </td>
                                                    <td class="style17" style="width: 132px">
                                                        <asp:Label ID="Label178" runat="server" Text="County"></asp:Label>
                                                    </td>
                                                    <td>
                                                        <telerik:RadComboBox ID="cboCounty" Runat="server" Skin="Web20" Width="250px">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboCounty" Selected="True" 
                                                                    Text="Retail" Value="R" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        <asp:Label ID="Label150" runat="server" Text="Business"></asp:Label>
                                                    </td>
                                                    <td class="style17" style="width: 431px">
                                                        <telerik:RadComboBox ID="cboBUS" Runat="server" Skin="Web20" Width="190px">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboBUS" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Medical" Value="M" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Non Medical" Value="N" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                    </td>
                                                    <td class="style17" style="width: 132px">
                                                        <asp:Label ID="Label180" runat="server" Text="GI Category"></asp:Label>
                                                    </td>
                                                    <td>
                                                        <telerik:RadComboBox ID="cboGI_Cat" Runat="server" Skin="Web20" Width="190px">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboGI_Cat" Selected="True" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Non-Motor" Value="Non_Motor" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Motor" Value="Motor" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        <asp:Label ID="Label10" runat="server" Text="Business/Action Type"></asp:Label>
                                                    </td>
                                                    <td class="style17" style="width: 431px">
                                                        <telerik:RadComboBox ID="cboBusiness" Runat="server" MarkFirstMatch="True" 
                                                            Skin="Web20" Width="190px">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" />
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="New" 
                                                                    Value="N" />
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Renewal" 
                                                                    Value="R" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Addon" Value="A" />
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Termination" 
                                                                    Value="T" />
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" 
                                                                    Text="Reinstatement" Value="RT" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Category Change" Value="CC" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Premium Recon" Value="PR" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Nill_Endr" Value="NE" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Fund_Topup" Value="FT" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Suspension" Value="SU" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Lift Suspension" Value="LS" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                    </td>
                                                    <td class="style17" style="width: 132px">
                                                        &nbsp;</td>
                                                    <td>
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        <asp:Label ID="Label171" runat="server" Text="Card Type"></asp:Label>
                                                    </td>
                                                    <td class="style17" style="width: 431px">
                                                        <telerik:RadComboBox ID="cboCard" Runat="server" MarkFirstMatch="True" 
                                                            Skin="Web20" Width="190px">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" />
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboCard" Selected="True" 
                                                                    Text="MTIBA" Value="MTIBA" />
                                                                <telerik:RadComboBoxItem runat="server" Text="SMART" Value="SMART" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                    </td>
                                                    <td class="style17" style="width: 132px">
                                                        &nbsp;</td>
                                                    <td>
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        <asp:Label ID="Label177" runat="server" Text="Total Paid Amt:"></asp:Label>
                                                    </td>
                                                    <td class="style17" style="width: 431px">
                                                        <telerik:RadNumericTextBox ID="txtpaid" Runat="server" Culture="en-US" 
                                                            Skin="Web20" Value="0" Width="200px">
                                                        </telerik:RadNumericTextBox>
                                                    </td>
                                                    <td class="style17" style="width: 132px">
                                                        &nbsp;</td>
                                                    <td>
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        <asp:Label ID="Label172" runat="server" Text="Payment Mode"></asp:Label>
                                                    </td>
                                                    <td class="style17" style="width: 431px">
                                                        <telerik:RadComboBox ID="cboPayment" Runat="server" MarkFirstMatch="True" 
                                                            Skin="Web20" Width="190px">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboPayment" Selected="True" 
                                                                    Text="MPESA" Value="MPESA" />
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboPayment" Text="EFT" 
                                                                    Value="EFT" />
                                                                <telerik:RadComboBoxItem runat="server" Text="CHEQ" Value="CHEQ" />
                                                                <telerik:RadComboBoxItem runat="server" Text="IPF" Value="IPF" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                    </td>
                                                    <td class="style17" style="width: 132px">
                                                        &nbsp;</td>
                                                    <td>
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        &nbsp;</td>
                                                    <td class="style17" style="width: 431px">
                                                        &nbsp;</td>
                                                    <td class="style17" style="width: 132px">
                                                        <asp:Label ID="Label179" runat="server" Text="Allocate To"></asp:Label>
                                                    </td>
                                                    <td>
                                                        <telerik:RadComboBox ID="cboAllocate" Runat="server" MarkFirstMatch="True" 
                                                            Skin="Web20" Width="250px" AllowCustomText="True" EmptyMessage="Select">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboAllocate" Selected="True" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="height: 36px; width: 163px">
                                                        &nbsp;</td>
                                                    <td colspan="3">
                                                        <telerik:RadButton ID="btnsave" runat="server" Skin="Simple" Text="Save" 
                                                            Width="150px">
                                                        </telerik:RadButton>
                                                        &nbsp;<telerik:RadButton ID="btnedit" runat="server" Skin="Simple" Text="Edit" 
                                                            Width="150px">
                                                        </telerik:RadButton>
                                                        &nbsp;<telerik:RadButton ID="btnnew" runat="server" Skin="Simple" Text="New" 
                                                            Width="150px">
                                                        </telerik:RadButton>
                                                        &nbsp;<asp:Label ID="lblSave" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                            ForeColor="Red"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="4">
                                                        <asp:Panel ID="Panel17" runat="server" Height="100%" ScrollBars="Both" 
                                                            Width="1146px">
                                                            <telerik:RadGrid ID="GDTracking" runat="server" AllowPaging="True" 
                                                                CellSpacing="0" GridLines="None" Height="100%" PageSize="30" Skin="Outlook" 
                                                                Width="100%">
                                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                        <HeaderStyle Width="20px" />
                                                                    </RowIndicatorColumn>
                                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                        <HeaderStyle Width="20px" />
                                                                    </ExpandCollapseColumn>
                                                                    <Columns>
                                                                        <telerik:GridButtonColumn CommandName="Select" 
                                                                            FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                            UniqueName="Select">
                                                                            <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                            <ItemStyle Width="50px" />
                                                                        </telerik:GridButtonColumn>
                                                                        <telerik:GridBoundColumn DataField="Receive_dt" 
                                                                            FilterControlAltText="Filter Receive_dt column" HeaderText="Receive_dt" 
                                                                            SortExpression="Receive_dt" UniqueName="Receive_dt">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                                            FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                            SortExpression="File_No" UniqueName="File_No">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                            FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                            SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Client_Type" 
                                                                            FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                            SortExpression="Client_Type" UniqueName="Client_Type">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Business_Type" 
                                                                            FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                            SortExpression="Business_Type" UniqueName="Business_Type">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="File_Status" 
                                                                            FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                            SortExpression="File_Status" UniqueName="File_Status">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                                            ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                                            Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                                            <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                                            <ItemStyle CssClass="ButtonColumn" />
                                                                        </telerik:GridButtonColumn>
                                                                    </Columns>
                                                                    <EditFormSettings>
                                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                        </EditColumn>
                                                                    </EditFormSettings>
                                                                </MasterTableView>
                                                                <ItemStyle Wrap="False" />
                                                                <FilterMenu EnableImageSprites="False">
                                                                </FilterMenu>
                                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                </HeaderContextMenu>
                                                            </telerik:RadGrid>
                                                        </asp:Panel>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="4">
                                                        <hr />
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td bgcolor="#666666" colspan="4">
                                                        <asp:Label ID="Label175" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                            Text="Documentation"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="height: 26px; width: 163px">
                                                        <asp:Label ID="Label176" runat="server" style="font-weight: 700" Text="Select"></asp:Label>
                                                    </td>
                                                    <td class="style17" style="width: 431px; height: 26px">
                                                        <telerik:RadComboBox ID="cbodocs" Runat="server" AccessibilityMode="True" 
                                                            AllowCustomText="True" MarkFirstMatch="True" Skin="Web20" Width="300px">
                                                        </telerik:RadComboBox>
                                                    </td>
                                                    <td class="style17" colspan="2" style="height: 26px">
                                                        <asp:Label ID="Label153" runat="server" Font-Bold="True" 
                                                            style="font-style: italic" 
                                                            Text="Related Documents can be attached as a Zip file"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px; height: 33px">
                                                    </td>
                                                    <td class="style17" style="width: 431px; height: 33px">
                                                        <asp:FileUpload ID="FL1" runat="server" Width="319px" />
                                                    </td>
                                                    <td class="style17" style="width: 132px; height: 33px">
                                                        &nbsp;</td>
                                                    <td style="height: 33px">
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px; height: 33px">
                                                        &nbsp;</td>
                                                    <td class="style17" style="width: 431px; height: 33px">
                                                        &nbsp;</td>
                                                    <td class="style17" style="width: 132px; height: 33px">
                                                        &nbsp;</td>
                                                    <td style="height: 33px">
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        &nbsp;</td>
                                                    <td class="style17" style="width: 431px">
                                                        <telerik:RadButton ID="btnupload" runat="server" Skin="Simple" Text="Upload" 
                                                            Width="150px">
                                                        </telerik:RadButton>
                                                    </td>
                                                    <td class="style17" colspan="2">
                                                        <asp:Label ID="lblupload" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                            ForeColor="Red"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="4">
                                                        <asp:Panel ID="Panel30" runat="server" Height="100%" ScrollBars="Both" 
                                                            Width="100%">
                                                            <telerik:RadGrid ID="GD_DOCS" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                GridLines="None" Height="100%" Skin="Outlook" Width="100%">
                                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="DOC_ID">
                                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                        <HeaderStyle Width="20px" />
                                                                    </RowIndicatorColumn>
                                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                        <HeaderStyle Width="20px" />
                                                                    </ExpandCollapseColumn>
                                                                    <Columns>
                                                                      
                                                                        <telerik:GridBoundColumn DataField="DOC_ID" 
                                                                            FilterControlAltText="Filter DOC_ID column" HeaderText="DOC_ID" 
                                                                            SortExpression="DOC_ID" UniqueName="DOC_ID">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                                            FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                            SortExpression="File_No" UniqueName="File_No">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Doc_Title" 
                                                                            FilterControlAltText="Filter Doc_Title column" HeaderText="Doc_Title" 
                                                                            SortExpression="Doc_Title" UniqueName="Doc_Title">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Doc_Date" 
                                                                            FilterControlAltText="Filter Doc_Date column" HeaderText="Doc_Date" 
                                                                            SortExpression="Doc_Date" UniqueName="Doc_Date">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="File_Name" 
                                                                            FilterControlAltText="Filter File_Name column" HeaderText="File_Name" 
                                                                            SortExpression="File_Name" UniqueName="File_Name">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Upload_By" 
                                                                            FilterControlAltText="Filter Upload_By column" HeaderText="Upload_By" 
                                                                            SortExpression="Upload_By" UniqueName="Upload_By">
                                                                        </telerik:GridBoundColumn>
                                                                         <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                                            ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                                            Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                                            <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                                            <ItemStyle CssClass="ButtonColumn" />
                                                                        </telerik:GridButtonColumn>
                                                                    </Columns>
                                                                    <EditFormSettings>
                                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                        </EditColumn>
                                                                    </EditFormSettings>
                                                                </MasterTableView>
                                                                <FilterMenu EnableImageSprites="False">
                                                                </FilterMenu>
                                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                </HeaderContextMenu>
                                                            </telerik:RadGrid>
                                                        </asp:Panel>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="4">
                                                        <hr />
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        <asp:Label ID="Label144" runat="server" Font-Bold="True" Text="Notes"></asp:Label>
                                                    </td>
                                                    <td colspan="2" rowspan="2">
                                                        <telerik:RadTextBox ID="txtcomment" Runat="server" Font-Size="Medium" 
                                                            Height="50px" Skin="Web20" TextMode="MultiLine" Width="500px">
                                                        </telerik:RadTextBox>
                                                    </td>
                                                    <td>
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        &nbsp;</td>
                                                    <td>
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 163px">
                                                        &nbsp;</td>
                                                    <td class="style17" style="width: 431px">
                                                        <asp:CheckBox ID="chkassembly" runat="server" Font-Bold="True" 
                                                            Font-Size="Small" Text="Documentation Complete" />
                                                    </td>
                                                    <td class="style17" style="width: 132px">
                                                        &nbsp;</td>
                                                    <td>
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td style="height: 38px; width: 163px">
                                                    </td>
                                                    <td colspan="3">
                                                        <telerik:RadButton ID="btnforward" runat="server" Skin="Simple" Text="Forward " 
                                                            Width="200px">
                                                        </telerik:RadButton>
                                                        &nbsp;
                                                        <asp:Label ID="lblerr" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                            ForeColor="Red"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="4">
                                                        <asp:Panel ID="Panel31" runat="server" Height="100%" ScrollBars="Both" 
                                                            Width="100%">
                                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                GridLines="None" Height="100%" Skin="Web20" Width="100%">
                                                                <MasterTableView AutoGenerateColumns="False">
                                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    </RowIndicatorColumn>
                                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    </ExpandCollapseColumn>
                                                                    <Columns>
                                                                        <telerik:GridBoundColumn DataField="Note_date" 
                                                                            FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                                            ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                                            <ItemStyle Width="100px" />
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                                            FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                            ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
                                                                            <ItemStyle Width="50px" />
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Note_From" 
                                                                            FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                                            ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                                            <ItemStyle Width="100px" />
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Notes" 
                                                                            FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                                            SortExpression="Notes" UniqueName="Notes">
                                                                        </telerik:GridBoundColumn>
                                                                    </Columns>
                                                                    <EditFormSettings>
                                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                        </EditColumn>
                                                                    </EditFormSettings>
                                                                </MasterTableView>
                                                                <ItemStyle Wrap="False" />
                                                                <FilterMenu EnableImageSprites="False">
                                                                </FilterMenu>
                                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                </HeaderContextMenu>
                                                            </telerik:RadGrid>
                                                        </asp:Panel>
                                                    </td>
                                                </tr>
                                            </table>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                                        </td>
                                </tr>
                            </table>
   </asp:Panel>
   </div>
</ContentTemplate>
          <Triggers>
        <asp:PostBackTrigger ControlID = "btnupload" />
          </Triggers>
          </asp:UpdatePanel>
</asp:Content>




