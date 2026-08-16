<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Activity_Tracking_Ret.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
      <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...."></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
        <div id="maincontainer">
            <table style="width: 100%" align="center">
                <tr>
                    <td align="center" bgcolor="#333333">
                        <asp:Label ID="Label6" runat="server" Font-Bold="True" Font-Size="Larger" 
                            ForeColor="Silver" style="font-weight: 700" 
                            Text="GENERATE LEAD"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Width="100%" Height="100%">
                            <table style="width: 100%">
                                <tr>
                                    <td style="width: 253px">
                                        <telerik:RadComboBox ID="cboagent" Runat="server" Skin="Sunset" 
                                            style="margin-left: 0px" Width="250px">
                                        </telerik:RadComboBox>
                                    </td>
                                    <td style="width: 384px">
                                        <asp:Label ID="lblmgr" runat="server" style="font-weight: 700"></asp:Label>
                                    </td>
                                    <td>
                                        &nbsp;</td>
                                    <td>
                                        &nbsp;</td>
                                    <td>
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td colspan="5">
                                        <asp:Panel ID="Panel14" runat="server">
                                            <table style="width: 100%">
                                                <tr>
                                                    <td style="width: 262px">
                                                        <asp:Label ID="Label153" runat="server" 
                                                            style="font-style: italic; font-weight: 700; color: #FF0000; background-color: #FFFFFF" 
                                                            Text="Search if Lead is Booked."></asp:Label>
                                                    </td>
                                                    <td style="width: 191px">
                                                        <telerik:RadTextBox ID="txtsearch" Runat="server" 
                                                            EmptyMessage="Name Search" Skin="Sunset" Width="225px" 
                                                            style="font-weight: 700">
                                                        </telerik:RadTextBox>
                                                    </td>
                                                    <td>
                                                        <telerik:RadButton ID="btnsearch" runat="server" Skin="Sunset" Text="Search">
                                                        </telerik:RadButton>
                                                    </td>
                                                    <td>
                                                        &nbsp;</td>
                                                </tr>
                                            </table>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="5">
                                        <asp:Panel ID="Panel13" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="100%">
                                            <telerik:RadGrid ID="GDSEARCH_1" runat="server" AllowPaging="True" 
                                                CellSpacing="0" GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>                                                                                                        
                                                        <telerik:GridBoundColumn DataField="LEAD_CODE" 
                                                            FilterControlAltText="Filter LEAD_CODE column" HeaderText="LEAD NO" 
                                                            SortExpression="LEAD_CODE" UniqueName="LEAD_CODE">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="LEAD_DATE" 
                                                            FilterControlAltText="Filter LEAD_DATE column" HeaderText="LEAD_DATE" 
                                                            SortExpression="LEAD_DATE" UniqueName="LEAD_DATE">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="BUSINESS_NAME" 
                                                            FilterControlAltText="Filter BUSINESS_NAME column" HeaderText="BUSINESS_NAME" 
                                                            SortExpression="BUSINESS_NAME" UniqueName="BUSINESS_NAME">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="COVER_TYPE" 
                                                            FilterControlAltText="Filter COVER_TYPE column" HeaderText="COVER_TYPE" 
                                                            SortExpression="COVER_TYPE" UniqueName="COVER_TYPE">
                                                        </telerik:GridBoundColumn>    
                                                                                                                                                        
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <PagerStyle Wrap="False" />
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="5">
                                        <asp:Label ID="lblmsg" runat="server" ForeColor="Red" style="font-weight: 700"></asp:Label>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel9" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" style="font-weight: 700" Width="100%">
                            <table style="width: 100%">
                                <tr>
                                    <td class="style8" colspan="4">
                                        <asp:Panel ID="Panel12" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="100%">
                                            <telerik:RadGrid ID="GDSEARCH" runat="server" AllowPaging="True" 
                                                CellSpacing="0" GridLines="None" Height="100%" Skin="Sunset" 
                                                Width="100%">
                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="ID">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridButtonColumn CommandName="Select" 
                                                            FilterControlAltText="Filter ID column" HeaderText="Select" Text="Select" 
                                                            UniqueName="Select">
                                                            <HeaderStyle ForeColor="Blue" Width="50px" />
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridButtonColumn>
                                                        <telerik:GridBoundColumn DataField="ID" FilterControlAltText="Filter ID column" 
                                                            HeaderText="ID" SortExpression="ID" UniqueName="ID">
                                                        </telerik:GridBoundColumn>
                                                            <telerik:GridBoundColumn DataField="LEAD_CODE" 
                                                            FilterControlAltText="Filter LEAD_CODE column" HeaderText="LEAD NO" 
                                                            SortExpression="LEAD_CODE" UniqueName="LEAD_CODE">
                                                        </telerik:GridBoundColumn>
                                                                <telerik:GridBoundColumn DataField="LEAD_DATE" 
                                                            FilterControlAltText="Filter LEAD_DATE column" HeaderText="LEAD_DATE" 
                                                            SortExpression="LEAD_DATE" UniqueName="LEAD_DATE">                                                       
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="BUSINESS_NAME" 
                                                            FilterControlAltText="Filter BUSINESS_NAME column" HeaderText="BUSINESS_NAME" 
                                                            SortExpression="BUSINESS_NAME" UniqueName="BUSINESS_NAME">
                                                        </telerik:GridBoundColumn>

                                                        <telerik:GridBoundColumn DataField="COVER_TYPE" 
                                                            FilterControlAltText="Filter COVER_TYPE column" HeaderText="COVER_TYPE" 
                                                            SortExpression="COVER_TYPE" UniqueName="COVER_TYPE">
                                                      </telerik:GridBoundColumn>
                                                             <telerik:GridBoundColumn DataField="FOLLOW_UP_DATE" 
                                                            FilterControlAltText="Filter FOLLOW_UP_DATE column" HeaderText="FOLLOW_UP_DATE" 
                                                            SortExpression="FOLLOW_UP_DATE" UniqueName="FOLLOW_UP_DATE">
                                                      </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="PROGRESS" 
                                                            FilterControlAltText="Filter PROGRESS column" HeaderText="PROGRESS" 
                                                            SortExpression="PROGRESS" UniqueName="PROGRESS">
                                                            </telerik:GridBoundColumn>
                                                           <telerik:GridBoundColumn DataField="FORECAST_AMT" 
                                                            FilterControlAltText="Filter FORECAST_AMT column" HeaderText="FORECAST_AMT" 
                                                            SortExpression="FORECAST_AMT" UniqueName="FORECAST_AMT"  DataFormatString="{0:#,#.##}" >                                                       
                                                        </telerik:GridBoundColumn>
                                                              <telerik:GridBoundColumn DataField="STATUS" 
                                                            FilterControlAltText="Filter STATUS column" HeaderText="STATUS" 
                                                            SortExpression="STATUS" UniqueName="STATUS">                                                       
                                                        </telerik:GridBoundColumn>
                                                   
                                                                                                                                  <telerik:GridTemplateColumn HeaderText="#" SortExpression="TicketID" AllowFiltering="false">
                                        
                                    </telerik:GridTemplateColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <PagerStyle Wrap="False" />
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="width: 137px" align="left">
                                        <asp:Label ID="Label128" runat="server" Text="Lead Date"></asp:Label>
                                    </td>
                                    <td style="width: 83px" align="left">
                                        <telerik:RadDatePicker ID="dtleaddate" Runat="server" MinDate="" Skin="Sunset" 
                                            Enabled="False">
                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                            </Calendar>
                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                            </DateInput>
                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                        </telerik:RadDatePicker>
                                    </td>
                                    <td class="style9" style="width: 146px" align="left">
                                        <asp:Label ID="Label147" runat="server" Text="Lead Status"></asp:Label>
                                    </td>
                                    <td style="width: 305px" align="left">
                                        <asp:Label ID="lblStatus" runat="server" ForeColor="Red"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="width: 137px" align="left">
                                        <asp:Label ID="Label137" runat="server" Text="Lead Name"></asp:Label>
                                    </td>
                                    <td align="left">
                                        <telerik:RadTextBox ID="txtleadname" Runat="server" Skin="Sunset" Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td class="style9" style="width: 146px" align="left">
                                        <asp:Label ID="Label141" runat="server" Text="Client Type"></asp:Label>
                                    </td>
                                    <td style="width: 305px" align="left">
                                        <telerik:RadComboBox ID="cboclient" Runat="server" AccessibilityMode="True" 
                                            AllowCustomText="True" MarkFirstMatch="True" Skin="Sunset" Width="200px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Text="Retail" Value="Retail" />
                                                <telerik:RadComboBoxItem runat="server" Text="SME" Value="SME" />
                                                <telerik:RadComboBoxItem runat="server" Text="Corp" Value="Corp" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="width: 137px" align="left">
                                        <asp:Label ID="Label132" runat="server" Text="Cover Type"></asp:Label>
                                    </td>
                                    <td style="width: 83px" align="left">
                                        <telerik:RadComboBox ID="cbocovertype" Runat="server" AccessibilityMode="True" 
                                            AllowCustomText="True" MarkFirstMatch="True" Skin="Sunset" Width="200px" 
                                            AutoPostBack="True">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Text="Medical" Value="Medical" />
                                                <telerik:RadComboBoxItem runat="server" Text="Non-Medical" 
                                                    Value="Non-Medical" />
                                                <telerik:RadComboBoxItem runat="server" Text="Medical/Non-Med" 
                                                    Value="Medical/Non-Med" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td class="style9" style="width: 146px" align="left">
                                        <asp:Label ID="Label139" runat="server" Text="Category"></asp:Label>
                                    </td>
                                    <td style="width: 305px" align="left">
                                        <telerik:RadComboBox ID="cbocategory" Runat="server" AccessibilityMode="True" 
                                            AllowCustomText="True" MarkFirstMatch="True" Skin="Sunset" Width="200px">
                                        </telerik:RadComboBox>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="4" align="left">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td align="left" colspan="4">
                                        <hr />
                                    </td>
                                </tr>
                                <tr>
                                    <td align="left">
                                        <asp:Label ID="Label140" runat="server" Text="Forecast Amount"></asp:Label>
                                    </td>
                                    <td align="left">
                                        <telerik:RadNumericTextBox ID="txtamount" Runat="server" Culture="en-US" 
                                            Skin="WebBlue" Value="0" Width="155px">
                                        </telerik:RadNumericTextBox>
                                    </td>
                                    <td align="left">
                                        <asp:Label ID="Label144" runat="server" Text="ForeCast Close"></asp:Label>
                                    </td>
                                    <td align="left" style="width: 305px">
                                        <telerik:RadDatePicker ID="dtclose" Runat="server" MinDate="" Skin="Web20">
                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                            </Calendar>
                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                            </DateInput>
                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                        </telerik:RadDatePicker>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="left">
                                        <asp:Label ID="Label138" runat="server" Text="Current Insurer"></asp:Label>
                                    </td>
                                    <td align="left">
                                        <telerik:RadTextBox ID="txtcurrentins" Runat="server" Skin="Sunset" 
                                            Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td class="style9" style="width: 146px" align="left">
                                        <asp:Label ID="Label146" runat="server" Text="Progress"></asp:Label>
                                    </td>
                                    <td style="width: 305px" align="left">
                                        <telerik:RadComboBox ID="cboprogress" Runat="server" AutoPostBack="True" 
                                            Skin="Web20">
                                        </telerik:RadComboBox>
                                        &nbsp;<asp:Label ID="lblperc" runat="server"></asp:Label>
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="width: 137px" align="left">
                                        <asp:Label ID="Label151" runat="server" Text="County"></asp:Label>
                                    </td>
                                    <td style="width: 83px" align="left">
                                        <telerik:RadComboBox ID="cbocounty" Runat="server" AccessibilityMode="True" 
                                            AllowCustomText="True" MarkFirstMatch="True" Skin="Sunset" Width="200px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Owner="cbocounty" Text="Retail" 
                                                    Value="Retail" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cbocounty" Text="SME" 
                                                    Value="SME" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cbocounty" Text="Corp" 
                                                    Value="Corp" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td class="style9" style="width: 146px" align="left">
                                        &nbsp;</td>
                                    <td style="width: 305px" align="left">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="4">
                                        <hr />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Label ID="Label148" runat="server" Text="Contact Name"></asp:Label>
                                    </td>
                                    <td>
                                        <telerik:RadTextBox ID="txtcontact" Runat="server" Skin="Sunset" Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td class="style9" style="width: 146px">
                                        <asp:Label ID="Label150" runat="server" Text="Phone No"></asp:Label>
                                    </td>
                                    <td style="width: 305px">
                                        <telerik:RadTextBox ID="txtphone" Runat="server" Skin="Sunset" Width="200px">
                                        </telerik:RadTextBox>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Label ID="Label149" runat="server" Text="Contact email"></asp:Label>
                                    </td>
                                    <td>
                                        <telerik:RadTextBox ID="txtemail" Runat="server" Skin="Sunset" Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td class="style9" style="width: 146px">
                                        &nbsp;</td>
                                    <td style="width: 305px">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Label ID="Label102" runat="server" Text="Followup Date"></asp:Label>
                                    </td>
                                    <td style="width: 83px">
                                        <telerik:RadDatePicker ID="dtfollow" Runat="server" MinDate="" Skin="Web20">
                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                            </Calendar>
                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                            </DateInput>
                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                        </telerik:RadDatePicker>
                                    </td>
                                    <td class="style9" style="width: 146px">
                                        <asp:Label ID="Label121" runat="server" Text="Comments"></asp:Label>
                                    </td>
                                    <td rowspan="3" style="width: 305px">
                                        <telerik:RadTextBox ID="txtcomment" Runat="server" Height="100px" Skin="Sunset" 
                                            TextMode="MultiLine" Width="300px">
                                        </telerik:RadTextBox>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="width: 137px">
                                        <asp:Label ID="Label152" runat="server" Text="Lead No"></asp:Label>
                                    </td>
                                    <td style="width: 83px">
                                        <asp:Label ID="lblcode" runat="server" ForeColor="Red"></asp:Label>
                                    </td>
                                    <td class="style9" style="width: 146px">
                                        <asp:Label ID="lblID" runat="server" ForeColor="Red" Visible="False"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="width: 137px">
                                        &nbsp;</td>
                                    <td style="width: 83px">
                                        &nbsp;</td>
                                    <td class="style9" style="width: 146px">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="2" style="height: 30px">
                                        <asp:Label ID="empcode" runat="server" ForeColor="Red" Visible="False"></asp:Label>
                                        </td>
                                    <td class="style11" style="width: 146px; height: 30px;">
                                        </td>
                                    <td style="width: 305px; height: 30px;">
                                        <asp:CheckBox ID="chknotify" runat="server" Text="Notify Mngr" />
                                    </td>
                                </tr>
                                    <tr>
                                        <td class="style8" colspan="2">
                                            <asp:Label ID="lblerr" runat="server" ForeColor="Red"></asp:Label>
                                            <asp:HiddenField ID="HiddenField1" runat="server" />
                                        </td>
                                        <td class="style9" style="width: 146px">
                                            &nbsp;</td>
                                        <td style="width: 305px">
                                            <telerik:RadButton ID="cmdsave" runat="server" Height="36px" Skin="Sunset" 
                                                Text="Save" Width="80px">
                                            </telerik:RadButton>
                                            &nbsp;<telerik:RadButton ID="cmdedit" runat="server" Skin="Sunset" Text="Edit" 
                                                Width="80px" Height="36px">
                                            </telerik:RadButton>
                                            &nbsp;<telerik:RadButton ID="cmdnew" runat="server" Skin="Sunset" Text="New" 
                                                Width="80px" Height="36px">
                                            </telerik:RadButton>
                                        </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                </tr>
            </table>
            </div>
        </ContentTemplate>

    </asp:UpdatePanel>
</asp:Content>
